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
import { EmailDigest } from './email-digest.entity.js';
import { PostEmailStatus } from './post-email-queue.entity.js';
let DigestEmailQueue = class DigestEmailQueue {
    id;
    digestId;
    digest;
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
], DigestEmailQueue.prototype, "id", void 0);
__decorate([
    Column({ name: 'digest_id', type: 'bigint' }),
    __metadata("design:type", Number)
], DigestEmailQueue.prototype, "digestId", void 0);
__decorate([
    ManyToOne(() => EmailDigest, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'digest_id' }),
    __metadata("design:type", Object)
], DigestEmailQueue.prototype, "digest", void 0);
__decorate([
    Column({ length: 255 }),
    __metadata("design:type", String)
], DigestEmailQueue.prototype, "email", void 0);
__decorate([
    Column({ name: 'recipient_name', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], DigestEmailQueue.prototype, "recipientName", void 0);
__decorate([
    Index(),
    Column({ type: 'enum', enum: PostEmailStatus, default: PostEmailStatus.QUEUED }),
    __metadata("design:type", String)
], DigestEmailQueue.prototype, "status", void 0);
__decorate([
    Column({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DigestEmailQueue.prototype, "attempts", void 0);
__decorate([
    Column({ name: 'last_attempt_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], DigestEmailQueue.prototype, "lastAttemptAt", void 0);
__decorate([
    Column({ name: 'sent_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], DigestEmailQueue.prototype, "sentAt", void 0);
__decorate([
    Column({ type: 'varchar', length: 1000, nullable: true }),
    __metadata("design:type", Object)
], DigestEmailQueue.prototype, "error", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], DigestEmailQueue.prototype, "createdAt", void 0);
DigestEmailQueue = __decorate([
    Entity('digest_email_queue'),
    Index(['digestId', 'email'], { unique: true })
], DigestEmailQueue);
export { DigestEmailQueue };
//# sourceMappingURL=digest-email-queue.entity.js.map