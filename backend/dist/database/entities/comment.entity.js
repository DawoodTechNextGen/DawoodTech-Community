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
let Comment = class Comment {
    id;
    postId;
    post;
    userId;
    author;
    content;
    parentId;
    parent;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint' }),
    __metadata("design:type", Number)
], Comment.prototype, "id", void 0);
__decorate([
    Index(),
    Column({ name: 'post_id', type: 'bigint' }),
    __metadata("design:type", Number)
], Comment.prototype, "postId", void 0);
__decorate([
    ManyToOne(() => Post, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'post_id' }),
    __metadata("design:type", Object)
], Comment.prototype, "post", void 0);
__decorate([
    Index(),
    Column({ name: 'user_id', type: 'bigint' }),
    __metadata("design:type", Number)
], Comment.prototype, "userId", void 0);
__decorate([
    ManyToOne(() => User, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'user_id' }),
    __metadata("design:type", Object)
], Comment.prototype, "author", void 0);
__decorate([
    Column({ type: 'varchar', length: 1000 }),
    __metadata("design:type", String)
], Comment.prototype, "content", void 0);
__decorate([
    Index(),
    Column({ name: 'parent_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], Comment.prototype, "parentId", void 0);
__decorate([
    ManyToOne(() => Comment, { onDelete: 'CASCADE', nullable: true }),
    JoinColumn({ name: 'parent_id' }),
    __metadata("design:type", Object)
], Comment.prototype, "parent", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], Comment.prototype, "createdAt", void 0);
Comment = __decorate([
    Entity('comments')
], Comment);
export { Comment };
//# sourceMappingURL=comment.entity.js.map