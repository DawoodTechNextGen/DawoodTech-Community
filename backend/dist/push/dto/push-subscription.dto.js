var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Type } from 'class-transformer';
import { IsString, IsUrl, MaxLength, ValidateNested } from 'class-validator';
class PushKeysDto {
    p256dh;
    auth;
}
__decorate([
    IsString(),
    MaxLength(255),
    __metadata("design:type", String)
], PushKeysDto.prototype, "p256dh", void 0);
__decorate([
    IsString(),
    MaxLength(255),
    __metadata("design:type", String)
], PushKeysDto.prototype, "auth", void 0);
export class SubscribePushDto {
    endpoint;
    keys;
}
__decorate([
    IsUrl({ protocols: ['https'], require_tld: false }),
    MaxLength(2000),
    __metadata("design:type", String)
], SubscribePushDto.prototype, "endpoint", void 0);
__decorate([
    ValidateNested(),
    Type(() => PushKeysDto),
    __metadata("design:type", PushKeysDto)
], SubscribePushDto.prototype, "keys", void 0);
export class UnsubscribePushDto {
    endpoint;
}
__decorate([
    IsString(),
    MaxLength(2000),
    __metadata("design:type", String)
], UnsubscribePushDto.prototype, "endpoint", void 0);
//# sourceMappingURL=push-subscription.dto.js.map