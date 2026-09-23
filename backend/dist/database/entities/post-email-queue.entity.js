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
export var PostEmailStatus;
(function (PostEmailStatus) {
    PostEmailStatus["QUEUED"] = "queued";
    PostEmailStatus["SENT"] = "sent";
    PostEmailStatus["FAILED"] = "failed";
    PostEmailStatus["SKIPPED"] = "skipped";
})(PostEmailStatus || (PostEmailStatus = {}));
let PostEmailQueue = class PostEmailQueue {
    id;
    postId;
    post;
    email;
    recipientName;
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
], PostEmailQueue.prototype, "id", void 0);
__decorate([
    Column({ name: 'post_id', type: 'bigint' }),
    __metadata("design:type", Number)
], PostEmailQueue.prototype, "postId", void 0);
__decorate([
    ManyToOne(() => Post, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'post_id' }),
    __metadata("design:type", Object)
], PostEmailQueue.prototype, "post", void 0);
__decorate([
    Column({ length: 255 }),
    __metadata("design:type", String)
], PostEmailQueue.prototype, "email", void 0);
__decorate([
    Column({ name: 'recipient_name', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], PostEmailQueue.prototype, "recipientName", void 0);
__decorate([
    Index(),
    Column({ type: 'enum', enum: PostEmailStatus, default: PostEmailStatus.QUEUED }),
    __metadata("design:type", String)
], PostEmailQueue.prototype, "status", void 0);
__decorate([
    Column({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PostEmailQueue.prototype, "attempts", void 0);
__decorate([
    Column({ name: 'last_attempt_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], PostEmailQueue.prototype, "lastAttemptAt", void 0);
__decorate([
    Column({ name: 'sent_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], PostEmailQueue.prototype, "sentAt", void 0);
__decorate([
    Column({ type: 'varchar', length: 1000, nullable: true }),
    __metadata("design:type", Object)
], PostEmailQueue.prototype, "error", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], PostEmailQueue.prototype, "createdAt", void 0);
PostEmailQueue = __decorate([
    Entity('post_email_queue'),
    Index(['postId', 'email'], { unique: true })
], PostEmailQueue);
export { PostEmailQueue };
//# sourceMappingURL=post-email-queue.entity.js.map