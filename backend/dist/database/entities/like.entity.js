var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, } from 'typeorm';
import { Post } from './post.entity.js';
import { User } from './user.entity.js';
let Like = class Like {
    postId;
    post;
    userId;
    user;
    createdAt;
};
__decorate([
    Index(),
    PrimaryColumn({ name: 'post_id', type: 'bigint' }),
    __metadata("design:type", Number)
], Like.prototype, "postId", void 0);
__decorate([
    ManyToOne(() => Post, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'post_id' }),
    __metadata("design:type", Object)
], Like.prototype, "post", void 0);
__decorate([
    PrimaryColumn({ name: 'user_id', type: 'bigint' }),
    __metadata("design:type", Number)
], Like.prototype, "userId", void 0);
__decorate([
    ManyToOne(() => User, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'user_id' }),
    __metadata("design:type", Object)
], Like.prototype, "user", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], Like.prototype, "createdAt", void 0);
Like = __decorate([
    Entity('likes')
], Like);
export { Like };
//# sourceMappingURL=like.entity.js.map