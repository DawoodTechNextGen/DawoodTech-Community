import { ConfigService } from '@nestjs/config';
interface SendMailInput {
    to: string;
    subject: string;
    html: string;
    text?: string;
    headers?: Record<string, string>;
}
export declare class MailService {
    private readonly config;
    private readonly logger;
    private readonly transporter;
    private readonly from;
    constructor(config: ConfigService);
    get isConfigured(): boolean;
    send({ to, subject, html, text, headers }: SendMailInput): Promise<void>;
    close(): void;
}
export {};
