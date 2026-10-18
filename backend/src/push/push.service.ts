import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { Repository } from 'typeorm';
import webpush from 'web-push';
import { PushSubscription } from '../database/entities/push-subscription.entity.js';
import type { SubscribePushDto } from './dto/push-subscription.dto.js';

export interface PushMessage {
  title: string;
  body: string;
  /** In-app path to open when the notification is tapped. */
  url: string;
  /** Same tag = replaces the previous notification instead of stacking. */
  tag?: string;
  /** Unread count for the app-icon badge (installed app). */
  badge?: number;
}

const hashEndpoint = (endpoint: string) => createHash('sha256').update(endpoint).digest('hex');

/**
 * Web Push: reaches members whose app is closed (phone lock screen, desktop
 * notification centre). Disabled — every call a no-op — until VAPID keys are
 * set in .env (`npx web-push generate-vapid-keys`).
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  readonly publicKey: string | null;

  constructor(
    @InjectRepository(PushSubscription)
    private readonly subscriptions: Repository<PushSubscription>,
    config: ConfigService,
  ) {
    const publicKey = config.get<string>('push.publicKey');
    const privateKey = config.get<string>('push.privateKey');
    if (publicKey && privateKey) {
      webpush.setVapidDetails(config.get<string>('push.subject')!, publicKey, privateKey);
      this.publicKey = publicKey;
    } else {
      this.publicKey = null;
    }
  }

  /** Saves (or moves to this member) a browser's subscription. */
  async subscribe(userId: number, dto: SubscribePushDto): Promise<void> {
    const endpointHash = hashEndpoint(dto.endpoint);
    // A shared device that switches accounts re-subscribes the same endpoint,
    // so it now belongs to the member who is signed in.
    await this.subscriptions.delete({ endpointHash });
    await this.subscriptions.save(
      this.subscriptions.create({
        userId,
        endpointHash,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
      }),
    );
  }

  async unsubscribe(endpoint: string): Promise<void> {
    await this.subscriptions.delete({ endpointHash: hashEndpoint(endpoint) });
  }

  /** Best effort: never throws, and forgets subscriptions the browser dropped. */
  async sendToUser(userId: number | string, message: PushMessage): Promise<void> {
    if (!this.publicKey) return;
    const subs = await this.subscriptions.findBy({ userId: Number(userId) });
    const payload = JSON.stringify(message);
    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
            { TTL: 24 * 60 * 60 },
          );
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await this.subscriptions.delete({ id: sub.id });
          } else {
            this.logger.warn(
              `Push to user ${userId} failed: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }
      }),
    );
  }
}
