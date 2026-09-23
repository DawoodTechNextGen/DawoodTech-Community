import { type Relation } from 'typeorm';
import { EmailDigest } from './email-digest.entity.js';
import { PostEmailStatus } from './post-email-queue.entity.js';
export declare class DigestEmailQueue {
    id: number;
    digestId: number;
    digest: Relation<EmailDigest>;
    email: string;
    recipientName: string | null;
    status: PostEmailStatus;
    attempts: number;
    lastAttemptAt: Date | null;
    sentAt: Date | null;
    error: string | null;
    createdAt: Date;
}
