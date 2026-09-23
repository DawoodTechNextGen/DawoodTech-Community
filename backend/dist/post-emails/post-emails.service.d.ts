import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { Post } from '../database/entities/post.entity.js';
import { PostEmailQueue } from '../database/entities/post-email-queue.entity.js';
import { User } from '../database/entities/user.entity.js';
import { type DigestPost } from '../mail/community-templates.js';
import { MailService } from '../mail/mail.service.js';
import { TaskdeskRecipientsService, type Recipient } from './taskdesk-recipients.service.js';
export type PostEmailMode = 'live' | 'test' | 'dry_run';
export interface WorkerRunResult {
    sent: number;
    failed: number;
    retrying: number;
    skipped: number;
}
export declare class PostEmailsService {
    private readonly posts;
    private readonly queue;
    private readonly users;
    private readonly dataSource;
    private readonly recipients;
    private readonly mail;
    private readonly config;
    private readonly logger;
    constructor(posts: Repository<Post>, queue: Repository<PostEmailQueue>, users: Repository<User>, dataSource: DataSource, recipients: TaskdeskRecipientsService, mail: MailService, config: ConfigService);
    get mode(): PostEmailMode;
    eligibleRecipients(): Promise<Recipient[]>;
    toDigestPost(post: Post): DigestPost;
    sendDigest(posts: Post[], email: string, recipientName: string | null, date: Date): Promise<void>;
    legacyQueuedCount(): Promise<number>;
    processBatch(): Promise<WorkerRunResult | null>;
    private sendQueued;
}
