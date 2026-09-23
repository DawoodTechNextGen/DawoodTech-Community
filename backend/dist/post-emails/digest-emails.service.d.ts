import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { DigestEmailQueue } from '../database/entities/digest-email-queue.entity.js';
import { EmailDigest } from '../database/entities/email-digest.entity.js';
import { Post } from '../database/entities/post.entity.js';
import { MailService } from '../mail/mail.service.js';
import { PostEmailsService, type PostEmailMode, type WorkerRunResult } from './post-emails.service.js';
export interface DigestStats {
    id: number;
    day: string;
    postCount: number;
    queued: number;
    sent: number;
    failed: number;
    skipped: number;
}
export interface DigestStatsResponse {
    mode: PostEmailMode;
    digestHour: number;
    timeZone: string;
    pendingPosts: {
        postId: number;
        title: string;
    }[];
    legacyQueued: number;
    digests: DigestStats[];
}
export declare class DigestEmailsService {
    private readonly posts;
    private readonly digests;
    private readonly queue;
    private readonly dataSource;
    private readonly postEmails;
    private readonly mail;
    private readonly config;
    private readonly logger;
    constructor(posts: Repository<Post>, digests: Repository<EmailDigest>, queue: Repository<DigestEmailQueue>, dataSource: DataSource, postEmails: PostEmailsService, mail: MailService, config: ConfigService);
    private get digestHour();
    private get timeZone();
    pendingPosts(): Promise<Post[]>;
    buildDueDigest(force?: boolean): Promise<void>;
    private build;
    processBatch(): Promise<WorkerRunResult | null>;
    private sendQueued;
    stats(limit?: number): Promise<DigestStatsResponse>;
}
