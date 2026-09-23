var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, } from 'typeorm';
import { User } from './user.entity.js';
import { PostMedia } from './post-media.entity.js';
export var PostStatus;
(function (PostStatus) {
    PostStatus["PENDING"] = "pending";
    PostStatus["APPROVED"] = "approved";
    PostStatus["REJECTED"] = "rejected";
})(PostStatus || (PostStatus = {}));
let Post = class Post {
    id;
    userId;
    author;
    content;
    status;
    reviewedBy;
    reviewedAt;
    notifyByEmail;
    notifiedAt;
    media;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint' }),
    __metadata("design:type", Number)
], Post.prototype, "id", void 0);
__decorate([
    Index(),
    Column({ name: 'user_id', type: 'bigint' }),
    __metadata("design:type", Number)
], Post.prototype, "userId", void 0);
__decorate([
    ManyToOne(() => User, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'user_id' }),
    __metadata("design:type", Object)
], Post.prototype, "author", void 0);
__decorate([
    Column({ type: 'text' }),
    __metadata("design:type", String)
], Post.prototype, "content", void 0);
__decorate([
    Index(),
    Column({ type: 'enum', enum: PostStatus, default: PostStatus.PENDING }),
    __metadata("design:type", String)
], Post.prototype, "status", void 0);
__decorate([
    Column({ name: 'reviewed_by', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], Post.prototype, "reviewedBy", void 0);
__decorate([
    Column({ name: 'reviewed_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], Post.prototype, "reviewedAt", void 0);
__decorate([
    Column({ name: 'notify_by_email', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Post.prototype, "notifyByEmail", void 0);
__decorate([
    Column({ name: 'notified_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], Post.prototype, "notifiedAt", void 0);
__decorate([
    OneToMany(() => PostMedia, (media) => media.post),
    __metadata("design:type", Array)
], Post.prototype, "media", void 0);
__decorate([
    Index(),
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], Post.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Post.prototype, "updatedAt", void 0);
Post = __decorate([
    Entity('posts')
], Post);
export { Post };
//# sourceMappingURL=post.entity.js.map