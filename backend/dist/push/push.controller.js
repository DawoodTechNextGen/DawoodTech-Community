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
import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { SubscribePushDto, UnsubscribePushDto } from './dto/push-subscription.dto.js';
import { PushService } from './push.service.js';
let PushController = class PushController {
    push;
    constructor(push) {
        this.push = push;
    }
    publicKey() {
        return { publicKey: this.push.publicKey };
    }
    async subscribe(user, dto) {
        await this.push.subscribe(user.id, dto);
    }
    async unsubscribe(dto) {
        await this.push.unsubscribe(dto.endpoint);
    }
};
__decorate([
    Get('public-key'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PushController.prototype, "publicKey", null);
__decorate([
    Post('subscribe'),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, SubscribePushDto]),
    __metadata("design:returntype", Promise)
], PushController.prototype, "subscribe", null);
__decorate([
    Post('unsubscribe'),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UnsubscribePushDto]),
    __metadata("design:returntype", Promise)
], PushController.prototype, "unsubscribe", null);
PushController = __decorate([
    Controller('push'),
    __metadata("design:paramtypes", [PushService])
], PushController);
export { PushController };
//# sourceMappingURL=push.controller.js.map