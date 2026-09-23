import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { Post } from '../database/entities/post.entity.js';
import { PostEmailQueue } from '../database/entities/post-email-queue.entity.js';
import { MailService } from '../mail/mail.service.js';
import { type PostPublishedEvent } from './post-email.events.js';
import { TaskdeskRecipientsService, type Recipient } from './taskdesk-recipients.service.js';
export type PostEmailMode = 'live' | 'test' | 'dry_run';
export interface PostEmailStats {
    postId: number;
    title: string;
    notifiedAt: string | null;
    queued: number;
    sent: number;
    failed: number;
    skipped: number;
}
export interface WorkerRunResult {
    sent: number;
    failed: number;
    retrying: number;
    skipped: number;
}
export declare class PostEmailsService {
    private readonly posts;
    private readonly queue;
    private readonly dataSource;
    private readonly recipients;
    private readonly mail;
    private readonly config;
    private readonly logger;
    constructor(posts: Repository<Post>, queue: Repository<PostEmailQueue>, dataSource: DataSource, recipients: TaskdeskRecipientsService, mail: MailService, config: ConfigService);
    get mode(): PostEmailMode;
    handlePostPublished({ postId }: PostPublishedEvent): Promise<void>;
    enqueueForPost(postId: number): Promise<void>;
    eligibleRecipients(): Promise<Recipient[]>;
    private insertQueueRows;
    processBatch(): Promise<WorkerRunResult | null>;
    private sendQueued;
    sendForPost(post: Post, email: string, recipientName: string | null): Promise<void>;
    stats(limit?: number): Promise<{
        mode: PostEmailMode;
        posts: PostEmailStats[];
    }>;
}
