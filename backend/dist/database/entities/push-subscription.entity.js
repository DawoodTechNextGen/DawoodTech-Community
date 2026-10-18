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
import { User } from './user.entity.js';
let PushSubscription = class PushSubscription {
    id;
    userId;
    user;
    endpointHash;
    endpoint;
    p256dh;
    auth;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint' }),
    __metadata("design:type", Number)
], PushSubscription.prototype, "id", void 0);
__decorate([
    Index(),
    Column({ name: 'user_id', type: 'bigint' }),
    __metadata("design:type", Number)
], PushSubscription.prototype, "userId", void 0);
__decorate([
    ManyToOne(() => User, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'user_id' }),
    __metadata("design:type", Object)
], PushSubscription.prototype, "user", void 0);
__decorate([
    Index({ unique: true }),
    Column({ name: 'endpoint_hash', type: 'char', length: 64 }),
    __metadata("design:type", String)
], PushSubscription.prototype, "endpointHash", void 0);
__decorate([
    Column({ type: 'text' }),
    __metadata("design:type", String)
], PushSubscription.prototype, "endpoint", void 0);
__decorate([
    Column({ length: 255 }),
    __metadata("design:type", String)
], PushSubscription.prototype, "p256dh", void 0);
__decorate([
    Column({ length: 255 }),
    __metadata("design:type", String)
], PushSubscription.prototype, "auth", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], PushSubscription.prototype, "createdAt", void 0);
PushSubscription = __decorate([
    Entity('push_subscriptions')
], PushSubscription);
export { PushSubscription };
//# sourceMappingURL=push-subscription.entity.js.map