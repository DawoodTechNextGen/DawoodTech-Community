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
import { PostEmailStatus } from './post-email-queue.entity.js';
export var ActivityEmailType;
(function (ActivityEmailType) {
    ActivityEmailType["LIKE"] = "like";
    ActivityEmailType["COMMENT"] = "comment";
    ActivityEmailType["REPLY"] = "reply";
    ActivityEmailType["THREAD_COMMENT"] = "thread_comment";
})(ActivityEmailType || (ActivityEmailType = {}));
let ActivityEmailQueue = class ActivityEmailQueue {
    id;
    dedupeKey;
    recipientUserId;
    email;
    type;
    postId;
    post;
    actorId;
    commentId;
    status;
    attempts;
    lastAttemptAt;
    sentAt;
    error;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint' }),
    __metadata("design:type", Number)
], ActivityEmailQueue.prototype, "id", void 0);
__decorate([
    Index({ unique: true }),
    Column({ name: 'dedupe_key', length: 191 }),
    __metadata("design:type", String)
], ActivityEmailQueue.prototype, "dedupeKey", void 0);
__decorate([
    Index(),
    Column({ name: 'recipient_user_id', type: 'bigint' }),
    __metadata("design:type", Number)
], ActivityEmailQueue.prototype, "recipientUserId", void 0);
__decorate([
    Column({ length: 255 }),
    __metadata("design:type", String)
], ActivityEmailQueue.prototype, "email", void 0);
__decorate([
    Column({ type: 'enum', enum: ActivityEmailType }),
    __metadata("design:type", String)
], ActivityEmailQueue.prototype, "type", void 0);
__decorate([
    Column({ name: 'post_id', type: 'bigint' }),
    __metadata("design:type", Number)
], ActivityEmailQueue.prototype, "postId", void 0);
__decorate([
    ManyToOne(() => Post, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'post_id' }),
    __metadata("design:type", Object)
], ActivityEmailQueue.prototype, "post", void 0);
__decorate([
    Column({ name: 'actor_id', type: 'bigint' }),
    __metadata("design:type", Number)
], ActivityEmailQueue.prototype, "actorId", void 0);
__decorate([
    Column({ name: 'comment_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], ActivityEmailQueue.prototype, "commentId", void 0);
__decorate([
    Index(),
    Column({ type: 'enum', enum: PostEmailStatus, default: PostEmailStatus.QUEUED }),
    __metadata("design:type", String)
], ActivityEmailQueue.prototype, "status", void 0);
__decorate([
    Column({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ActivityEmailQueue.prototype, "attempts", void 0);
__decorate([
    Column({ name: 'last_attempt_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], ActivityEmailQueue.prototype, "lastAttemptAt", void 0);
__decorate([
    Column({ name: 'sent_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], ActivityEmailQueue.prototype, "sentAt", void 0);
__decorate([
    Column({ type: 'varchar', length: 1000, nullable: true }),
    __metadata("design:type", Object)
], ActivityEmailQueue.prototype, "error", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], ActivityEmailQueue.prototype, "createdAt", void 0);
ActivityEmailQueue = __decorate([
    Entity('activity_email_queue')
], ActivityEmailQueue);
export { ActivityEmailQueue };
//# sourceMappingURL=activity-email-queue.entity.js.map