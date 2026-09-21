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
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CommentsService } from './comments.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
let PostCommentsController = class PostCommentsController {
    comments;
    constructor(comments) {
        this.comments = comments;
    }
    async create(postId, user, dto) {
        return this.comments.create(Number(postId), user.id, dto);
    }
    async list(postId, user) {
        return this.comments.findByPost(Number(postId), user.id);
    }
};
__decorate([
    Post(),
    __param(0, Param('postId')),
    __param(1, CurrentUser()),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, CreateCommentDto]),
    __metadata("design:returntype", Promise)
], PostCommentsController.prototype, "create", null);
__decorate([
    Get(),
    __param(0, Param('postId')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PostCommentsController.prototype, "list", null);
PostCommentsController = __decorate([
    Controller('posts/:postId/comments'),
    __metadata("design:paramtypes", [CommentsService])
], PostCommentsController);
export { PostCommentsController };
//# sourceMappingURL=post-comments.controller.js.map