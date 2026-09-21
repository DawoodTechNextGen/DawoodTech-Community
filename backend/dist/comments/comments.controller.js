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
import { Controller, Delete, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CommentsService } from './comments.service.js';
let CommentsController = class CommentsController {
    comments;
    constructor(comments) {
        this.comments = comments;
    }
    async remove(id, user) {
        await this.comments.remove(Number(id), user.id);
    }
};
__decorate([
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, Param('id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "remove", null);
CommentsController = __decorate([
    Controller('comments'),
    __metadata("design:paramtypes", [CommentsService])
], CommentsController);
export { CommentsController };
//# sourceMappingURL=comments.controller.js.map