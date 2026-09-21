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
let PostMedia = class PostMedia {
    id;
    postId;
    post;
    url;
    mediaType;
    sortOrder;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint' }),
    __metadata("design:type", Number)
], PostMedia.prototype, "id", void 0);
__decorate([
    Index(),
    Column({ name: 'post_id', type: 'bigint' }),
    __metadata("design:type", Number)
], PostMedia.prototype, "postId", void 0);
__decorate([
    ManyToOne(() => Post, (post) => post.media, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'post_id' }),
    __metadata("design:type", Object)
], PostMedia.prototype, "post", void 0);
__decorate([
    Column({ length: 500 }),
    __metadata("design:type", String)
], PostMedia.prototype, "url", void 0);
__decorate([
    Column({ name: 'media_type', type: 'enum', enum: ['image'], default: 'image' }),
    __metadata("design:type", String)
], PostMedia.prototype, "mediaType", void 0);
__decorate([
    Column({ name: 'sort_order', type: 'tinyint', unsigned: true, default: 0 }),
    __metadata("design:type", Number)
], PostMedia.prototype, "sortOrder", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], PostMedia.prototype, "createdAt", void 0);
PostMedia = __decorate([
    Entity('post_media')
], PostMedia);
export { PostMedia };
//# sourceMappingURL=post-media.entity.js.map