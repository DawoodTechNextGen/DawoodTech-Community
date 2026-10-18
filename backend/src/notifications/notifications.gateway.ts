import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { WebSocketGateway, WebSocketServer, type OnGatewayInit } from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import type { JwtPayload } from '../auth/jwt.strategy.js';
import { User, UserRole, UserStatus } from '../database/entities/user.entity.js';
import { NotificationEvents, type UserAccessChangedEvent } from './notification.events.js';
import type { NotificationResponse } from './notification.mapper.js';

/** Events the server pushes to clients on the /notifications namespace. */
export const SocketEvents = {
  /** A new notification for this user: { notification, unreadCount }. */
  NotificationNew: 'notification:new',
  /** The unread count changed elsewhere (e.g. read in another tab): { count }. */
  UnreadCount: 'notification:unread-count',
  /** Admins only — the moderation queue changed, refetch it. */
  PendingPostsChanged: 'admin:pending-posts-changed',
} as const;

const userRoom = (userId: number | string) => `user:${userId}`;
const ADMIN_ROOM = 'role:admin';

/**
 * Live, in-app notifications over Socket.IO. Each signed-in tab connects to
 * /notifications with its access token and joins its own user room; the
 * server pushes to that room whenever a notification is recorded. Socket.IO
 * falls back to HTTP long-polling where WebSockets aren't available.
 */
@WebSocketGateway({ namespace: '/notifications' })
export class NotificationsGateway implements OnGatewayInit {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  private readonly server!: Namespace;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  // Authenticates during the handshake, so a bad or expired token surfaces on
  // the client as `connect_error` ("unauthorized") — its cue to refresh the
  // token and try again — instead of a connect followed by a disconnect.
  afterInit(server: Namespace): void {
    server.use((socket, next) => {
      this.authenticate(socket)
        .then(() => next())
        .catch(() => next(new Error('unauthorized')));
    });
  }

  private async authenticate(socket: Socket): Promise<void> {
    const token = (socket.handshake.auth as { token?: unknown } | undefined)?.token;
    if (typeof token !== 'string' || !token) throw new Error('missing token');

    const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
      secret: this.config.get<string>('jwt.accessSecret'),
    });
    const user = await this.users.findOne({
      where: { id: payload.sub },
      select: { id: true, role: true, status: true },
    });
    if (!user || user.status === UserStatus.DISABLED) throw new Error('disabled');

    await socket.join(userRoom(payload.sub));
    if (user.role === UserRole.ADMIN) await socket.join(ADMIN_ROOM);
  }

  sendNotification(recipientId: number, notification: NotificationResponse, unreadCount: number) {
    this.server
      .to(userRoom(recipientId))
      .emit(SocketEvents.NotificationNew, { notification, unreadCount });
  }

  sendUnreadCount(userId: number, count: number) {
    this.server.to(userRoom(userId)).emit(SocketEvents.UnreadCount, { count });
  }

  @OnEvent(NotificationEvents.PendingPostsChanged)
  handlePendingPostsChanged() {
    this.server.to(ADMIN_ROOM).emit(SocketEvents.PendingPostsChanged);
  }

  // A blocked member is cut off right away; a role change reconnects them so
  // they join (or leave) the admin room. The client reconnects on its own.
  @OnEvent(NotificationEvents.UserAccessChanged)
  handleUserAccessChanged({ userId }: UserAccessChangedEvent) {
    this.server.in(userRoom(userId)).disconnectSockets(true);
    this.logger.log(`Closed live connections of user ${userId} after an access change.`);
  }
}
