var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, } from 'typeorm';
import { Post } from './post.entity.js';
import { User } from './user.entity.js';
export var NotificationType;
(function (NotificationType) {
    NotificationType["COMMENT"] = "comment";
    NotificationType["FOLLOW"] = "follow";
    NotificationType["LIKE"] = "like";
    NotificationType["POST_APPROVED"] = "post_approved";
    NotificationType["POST_REJECTED"] = "post_rejected";
})(NotificationType || (NotificationType = {}));
let Notification = class Notification {
    id;
    recipientId;
    recipient;
    actorId;
    actor;
    type;
    postId;
    post;
    isRead;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint' }),
    __metadata("design:type", Number)
], Notification.prototype, "id", void 0);
__decorate([
    Index(),
    Column({ name: 'recipient_id', type: 'bigint' }),
    __metadata("design:type", Number)
], Notification.prototype, "recipientId", void 0);
__decorate([
    ManyToOne(() => User, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'recipient_id' }),
    __metadata("design:type", Object)
], Notification.prototype, "recipient", void 0);
__decorate([
    Column({ name: 'actor_id', type: 'bigint' }),
    __metadata("design:type", Number)
], Notification.prototype, "actorId", void 0);
__decorate([
    ManyToOne(() => User, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'actor_id' }),
    __metadata("design:type", Object)
], Notification.prototype, "actor", void 0);
__decorate([
    Column({ type: 'enum', enum: NotificationType }),
    __metadata("design:type", String)
], Notification.prototype, "type", void 0);
__decorate([
    Column({ name: 'post_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "postId", void 0);
__decorate([
    ManyToOne(() => Post, { onDelete: 'CASCADE', nullable: true }),
    JoinColumn({ name: 'post_id' }),
    __metadata("design:type", Object)
], Notification.prototype, "post", void 0);
__decorate([
    Column({ name: 'is_read', default: false }),
    __metadata("design:type", Boolean)
], Notification.prototype, "isRead", void 0);
__decorate([
    Index(),
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], Notification.prototype, "createdAt", void 0);
Notification = __decorate([
    Entity('notifications')
], Notification);
export { Notification };
//# sourceMappingURL=notification.entity.js.map