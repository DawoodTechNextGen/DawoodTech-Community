var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { HttpException, HttpStatus, Injectable, SetMetadata, } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
const RATE_LIMIT_KEY = 'rateLimit';
export const RateLimit = (options) => SetMetadata(RATE_LIMIT_KEY, options);
let RateLimitGuard = class RateLimitGuard {
    reflector;
    buckets = new Map();
    lastSweep = Date.now();
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const options = this.reflector.get(RATE_LIMIT_KEY, context.getHandler());
        if (!options)
            return true;
        const request = context.switchToHttp().getRequest();
        const route = `${context.getClass().name}.${context.getHandler().name}`;
        const now = Date.now();
        this.sweep(now);
        this.hit(`${route}:ip:${request.ip ?? 'unknown'}`, options.perIp, options.windowMs, now);
        const email = request.body?.email;
        if (options.perEmail && typeof email === 'string' && email) {
            this.hit(`${route}:email:${email.trim().toLowerCase()}`, options.perEmail, options.windowMs, now);
        }
        return true;
    }
    hit(key, limit, windowMs, now) {
        let bucket = this.buckets.get(key);
        if (!bucket || bucket.resetAt <= now) {
            bucket = { count: 0, resetAt: now + windowMs };
            this.buckets.set(key, bucket);
        }
        bucket.count++;
        if (bucket.count > limit) {
            const minutes = Math.max(1, Math.ceil((bucket.resetAt - now) / 60_000));
            throw new HttpException(`Too many attempts — please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`, HttpStatus.TOO_MANY_REQUESTS);
        }
    }
    sweep(now) {
        if (now - this.lastSweep < 60_000)
            return;
        this.lastSweep = now;
        for (const [key, bucket] of this.buckets) {
            if (bucket.resetAt <= now)
                this.buckets.delete(key);
        }
    }
};
RateLimitGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Reflector])
], RateLimitGuard);
export { RateLimitGuard };
//# sourceMappingURL=rate-limit.guard.js.map