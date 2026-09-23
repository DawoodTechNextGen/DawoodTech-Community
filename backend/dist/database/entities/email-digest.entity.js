var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
let EmailDigest = class EmailDigest {
    id;
    digestKey;
    postIds;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint' }),
    __metadata("design:type", Number)
], EmailDigest.prototype, "id", void 0);
__decorate([
    Index({ unique: true }),
    Column({ name: 'digest_key', length: 10 }),
    __metadata("design:type", String)
], EmailDigest.prototype, "digestKey", void 0);
__decorate([
    Column({ name: 'post_ids', type: 'simple-json' }),
    __metadata("design:type", Array)
], EmailDigest.prototype, "postIds", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], EmailDigest.prototype, "createdAt", void 0);
EmailDigest = __decorate([
    Entity('email_digests')
], EmailDigest);
export { EmailDigest };
//# sourceMappingURL=email-digest.entity.js.map