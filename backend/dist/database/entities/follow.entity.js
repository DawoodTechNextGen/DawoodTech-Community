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
import { User } from './user.entity.js';
let Follow = class Follow {
    followerId;
    follower;
    followingId;
    following;
    createdAt;
};
__decorate([
    Index(),
    PrimaryColumn({ name: 'follower_id', type: 'bigint' }),
    __metadata("design:type", Number)
], Follow.prototype, "followerId", void 0);
__decorate([
    ManyToOne(() => User, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'follower_id' }),
    __metadata("design:type", Object)
], Follow.prototype, "follower", void 0);
__decorate([
    Index(),
    PrimaryColumn({ name: 'following_id', type: 'bigint' }),
    __metadata("design:type", Number)
], Follow.prototype, "followingId", void 0);
__decorate([
    ManyToOne(() => User, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'following_id' }),
    __metadata("design:type", Object)
], Follow.prototype, "following", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], Follow.prototype, "createdAt", void 0);
Follow = __decorate([
    Entity('follows')
], Follow);
export { Follow };
//# sourceMappingURL=follow.entity.js.map