var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsGateway_1;
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../database/entities/user.entity.js';
import { NotificationEvents } from './notification.events.js';
export const SocketEvents = {
    NotificationNew: 'notification:new',
    UnreadCount: 'notification:unread-count',
    PendingPostsChanged: 'admin:pending-posts-changed',
};
const userRoom = (userId) => `user:${userId}`;
const ADMIN_ROOM = 'role:admin';
let NotificationsGateway = NotificationsGateway_1 = class NotificationsGateway {
    jwt;
    config;
    users;
    logger = new Logger(NotificationsGateway_1.name);
    server;
    constructor(jwt, config, users) {
        this.jwt = jwt;
        this.config = config;
        this.users = users;
    }
    afterInit(server) {
        server.use((socket, next) => {
            this.authenticate(socket)
                .then(() => next())
                .catch(() => next(new Error('unauthorized')));
        });
    }
    async authenticate(socket) {
        const token = socket.handshake.auth?.token;
        if (typeof token !== 'string' || !token)
            throw new Error('missing token');
        const payload = await this.jwt.verifyAsync(token, {
            secret: this.config.get('jwt.accessSecret'),
        });
        const user = await this.users.findOne({
            where: { id: payload.sub },
            select: { id: true, role: true, status: true },
        });
        if (!user || user.status === UserStatus.DISABLED)
            throw new Error('disabled');
        await socket.join(userRoom(payload.sub));
        if (user.role === UserRole.ADMIN)
            await socket.join(ADMIN_ROOM);
    }
    sendNotification(recipientId, notification, unreadCount) {
        this.server
            .to(userRoom(recipientId))
            .emit(SocketEvents.NotificationNew, { notification, unreadCount });
    }
    sendUnreadCount(userId, count) {
        this.server.to(userRoom(userId)).emit(SocketEvents.UnreadCount, { count });
    }
    handlePendingPostsChanged() {
        this.server.to(ADMIN_ROOM).emit(SocketEvents.PendingPostsChanged);
    }
    handleUserAccessChanged({ userId }) {
        this.server.in(userRoom(userId)).disconnectSockets(true);
        this.logger.log(`Closed live connections of user ${userId} after an access change.`);
    }
};
__decorate([
    WebSocketServer(),
    __metadata("design:type", Function)
], NotificationsGateway.prototype, "server", void 0);
__decorate([
    OnEvent(NotificationEvents.PendingPostsChanged),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handlePendingPostsChanged", null);
__decorate([
    OnEvent(NotificationEvents.UserAccessChanged),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handleUserAccessChanged", null);
NotificationsGateway = NotificationsGateway_1 = __decorate([
    WebSocketGateway({ namespace: '/notifications' }),
    __param(2, InjectRepository(User)),
    __metadata("design:paramtypes", [JwtService,
        ConfigService,
        Repository])
], NotificationsGateway);
export { NotificationsGateway };
//# sourceMappingURL=notifications.gateway.js.map