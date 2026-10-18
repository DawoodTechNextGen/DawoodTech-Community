import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { type OnGatewayInit } from '@nestjs/websockets';
import type { Namespace } from 'socket.io';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity.js';
import { type UserAccessChangedEvent } from './notification.events.js';
import type { NotificationResponse } from './notification.mapper.js';
export declare const SocketEvents: {
    readonly NotificationNew: "notification:new";
    readonly UnreadCount: "notification:unread-count";
    readonly PendingPostsChanged: "admin:pending-posts-changed";
};
export declare class NotificationsGateway implements OnGatewayInit {
    private readonly jwt;
    private readonly config;
    private readonly users;
    private readonly logger;
    private readonly server;
    constructor(jwt: JwtService, config: ConfigService, users: Repository<User>);
    afterInit(server: Namespace): void;
    private authenticate;
    sendNotification(recipientId: number, notification: NotificationResponse, unreadCount: number): void;
    sendUnreadCount(userId: number, count: number): void;
    handlePendingPostsChanged(): void;
    handleUserAccessChanged({ userId }: UserAccessChangedEvent): void;
}
