var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
export class SignupDto {
    email;
    username;
    fullName;
    password;
}
__decorate([
    IsEmail(),
    __metadata("design:type", String)
], SignupDto.prototype, "email", void 0);
__decorate([
    IsString(),
    MinLength(3),
    MaxLength(50),
    Matches(/^[a-zA-Z0-9_.]+$/, {
        message: 'username may only contain letters, numbers, underscores and dots',
    }),
    __metadata("design:type", String)
], SignupDto.prototype, "username", void 0);
__decorate([
    IsString(),
    MinLength(2),
    MaxLength(150),
    __metadata("design:type", String)
], SignupDto.prototype, "fullName", void 0);
__decorate([
    IsString(),
    MinLength(8),
    MaxLength(255),
    __metadata("design:type", String)
], SignupDto.prototype, "password", void 0);
//# sourceMappingURL=signup.dto.js.map