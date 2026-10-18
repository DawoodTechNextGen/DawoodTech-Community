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
export var MilestoneKind;
(function (MilestoneKind) {
    MilestoneKind["JOINED"] = "joined";
    MilestoneKind["INTERNSHIP_COMPLETED"] = "internship_completed";
})(MilestoneKind || (MilestoneKind = {}));
let Milestone = class Milestone {
    id;
    sourceKey;
    kind;
    userId;
    postId;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint' }),
    __metadata("design:type", Number)
], Milestone.prototype, "id", void 0);
__decorate([
    Index({ unique: true }),
    Column({ name: 'source_key', length: 64 }),
    __metadata("design:type", String)
], Milestone.prototype, "sourceKey", void 0);
__decorate([
    Column({ type: 'enum', enum: MilestoneKind }),
    __metadata("design:type", String)
], Milestone.prototype, "kind", void 0);
__decorate([
    Index(),
    Column({ name: 'user_id', type: 'bigint' }),
    __metadata("design:type", Number)
], Milestone.prototype, "userId", void 0);
__decorate([
    Column({ name: 'post_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], Milestone.prototype, "postId", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], Milestone.prototype, "createdAt", void 0);
Milestone = __decorate([
    Entity('milestones')
], Milestone);
export { Milestone };
//# sourceMappingURL=milestone.entity.js.map