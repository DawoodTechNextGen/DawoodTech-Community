import { type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface Recipient {
    email: string;
    name: string | null;
}
export declare class TaskdeskRecipientsService implements OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private pool;
    constructor(config: ConfigService);
    private getPool;
    fetchRecipients(): Promise<Recipient[]>;
    onModuleDestroy(): Promise<void>;
}
export declare function dedupeRecipients(rows: {
    name: string | null;
    email: string | null;
}[]): Recipient[];
