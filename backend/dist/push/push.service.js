var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PushService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { Repository } from 'typeorm';
import webpush from 'web-push';
import { PushSubscription } from '../database/entities/push-subscription.entity.js';
const hashEndpoint = (endpoint) => createHash('sha256').update(endpoint).digest('hex');
let PushService = PushService_1 = class PushService {
    subscriptions;
    logger = new Logger(PushService_1.name);
    publicKey;
    constructor(subscriptions, config) {
        this.subscriptions = subscriptions;
        const publicKey = config.get('push.publicKey');
        const privateKey = config.get('push.privateKey');
        if (publicKey && privateKey) {
            webpush.setVapidDetails(config.get('push.subject'), publicKey, privateKey);
            this.publicKey = publicKey;
        }
        else {
            this.publicKey = null;
        }
    }
    async subscribe(userId, dto) {
        const endpointHash = hashEndpoint(dto.endpoint);
        await this.subscriptions.delete({ endpointHash });
        await this.subscriptions.save(this.subscriptions.create({
            userId,
            endpointHash,
            endpoint: dto.endpoint,
            p256dh: dto.keys.p256dh,
            auth: dto.keys.auth,
        }));
    }
    async unsubscribe(endpoint) {
        await this.subscriptions.delete({ endpointHash: hashEndpoint(endpoint) });
    }
    async sendToUser(userId, message) {
        if (!this.publicKey)
            return;
        const subs = await this.subscriptions.findBy({ userId: Number(userId) });
        const payload = JSON.stringify(message);
        await Promise.all(subs.map(async (sub) => {
            try {
                await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                }, payload, { TTL: 24 * 60 * 60 });
            }
            catch (err) {
                const status = err.statusCode;
                if (status === 404 || status === 410) {
                    await this.subscriptions.delete({ id: sub.id });
                }
                else {
                    this.logger.warn(`Push to user ${userId} failed: ${err instanceof Error ? err.message : String(err)}`);
                }
            }
        }));
    }
};
PushService = PushService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(PushSubscription)),
    __metadata("design:paramtypes", [Repository,
        ConfigService])
], PushService);
export { PushService };
//# sourceMappingURL=push.service.js.map