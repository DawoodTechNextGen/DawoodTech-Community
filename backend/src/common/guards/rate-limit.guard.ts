import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
  type CanActivate,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

export interface RateLimitOptions {
  windowMs: number;
  /** Requests allowed per visitor IP in the window. */
  perIp: number;
  /** Requests allowed per `email` in the request body (across all IPs), so
   *  one address can't be flooded with emails from many machines. */
  perEmail?: number;
}

const RATE_LIMIT_KEY = 'rateLimit';
export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Fixed-window, in-memory limiter for the endpoints that send email or check
 * passwords. In-memory is enough for this single-process app; counters reset
 * on restart. Use with @UseGuards(RateLimitGuard) + @RateLimit({...}).
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();
  private lastSweep = Date.now();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.get<RateLimitOptions | undefined>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );
    if (!options) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const route = `${context.getClass().name}.${context.getHandler().name}`;
    const now = Date.now();
    this.sweep(now);

    this.hit(`${route}:ip:${request.ip ?? 'unknown'}`, options.perIp, options.windowMs, now);

    const email = (request.body as { email?: unknown } | undefined)?.email;
    if (options.perEmail && typeof email === 'string' && email) {
      this.hit(
        `${route}:email:${email.trim().toLowerCase()}`,
        options.perEmail,
        options.windowMs,
        now,
      );
    }
    return true;
  }

  private hit(key: string, limit: number, windowMs: number, now: number): void {
    let bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      this.buckets.set(key, bucket);
    }
    bucket.count++;
    if (bucket.count > limit) {
      const minutes = Math.max(1, Math.ceil((bucket.resetAt - now) / 60_000));
      throw new HttpException(
        `Too many attempts — please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /** Drops expired buckets now and then so the map can't grow without bound. */
  private sweep(now: number): void {
    if (now - this.lastSweep < 60_000) return;
    this.lastSweep = now;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}
