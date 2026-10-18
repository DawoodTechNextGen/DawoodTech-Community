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
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post as HttpPost, Query, } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { PostsService } from './posts.service.js';
let PostsController = class PostsController {
    posts;
    constructor(posts) {
        this.posts = posts;
    }
    async create(user, dto) {
        return this.posts.create(user.id, dto);
    }
    async feed(user, cursor) {
        return this.posts.findFeed(cursor, user.id);
    }
    async explore(user, cursor) {
        return this.posts.findExplore(cursor, user.id);
    }
    async questions(user, cursor) {
        return this.posts.findQuestions(cursor, user.id);
    }
    async trendingTags() {
        return this.posts.trendingTags();
    }
    async byTag(tag, user, cursor) {
        return this.posts.findByTag(tag, cursor, user.id);
    }
    async search(user, q) {
        const query = q?.trim() ?? '';
        return query.length >= 2 ? this.posts.search(query.slice(0, 100), user.id) : [];
    }
    async pinned(user) {
        return this.posts.findPinned(user.id);
    }
    async getOne(id, user) {
        return this.posts.getByIdOrFail(id, user.id);
    }
    async update(id, user, dto) {
        return this.posts.updateOwn(id, user.id, dto);
    }
    async remove(id, user) {
        await this.posts.delete(id, user);
    }
};
__decorate([
    HttpPost(),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreatePostDto]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "create", null);
__decorate([
    Get('feed'),
    __param(0, CurrentUser()),
    __param(1, Query('cursor')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "feed", null);
__decorate([
    Get('explore'),
    __param(0, CurrentUser()),
    __param(1, Query('cursor')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "explore", null);
__decorate([
    Get('questions'),
    __param(0, CurrentUser()),
    __param(1, Query('cursor')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "questions", null);
__decorate([
    Get('tags/trending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "trendingTags", null);
__decorate([
    Get('tags/:tag'),
    __param(0, Param('tag')),
    __param(1, CurrentUser()),
    __param(2, Query('cursor')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "byTag", null);
__decorate([
    Get('search'),
    __param(0, CurrentUser()),
    __param(1, Query('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "search", null);
__decorate([
    Get('pinned'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "pinned", null);
__decorate([
    Get(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getOne", null);
__decorate([
    Patch(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, CurrentUser()),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, UpdatePostDto]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "update", null);
__decorate([
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "remove", null);
PostsController = __decorate([
    Controller('posts'),
    __metadata("design:paramtypes", [PostsService])
], PostsController);
export { PostsController };
//# sourceMappingURL=posts.controller.js.map