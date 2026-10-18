import { ExecutionContext, type CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export interface RateLimitOptions {
    windowMs: number;
    perIp: number;
    perEmail?: number;
}
export declare const RateLimit: (options: RateLimitOptions) => import("@nestjs/common").CustomDecorator<string>;
export declare class RateLimitGuard implements CanActivate {
    private readonly reflector;
    private readonly buckets;
    private lastSweep;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
    private hit;
    private sweep;
}
