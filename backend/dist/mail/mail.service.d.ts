import { ConfigService } from '@nestjs/config';
interface SendMailInput {
    to: string;
    subject: string;
    html: string;
}
export declare class MailService {
    private readonly config;
    private readonly logger;
    private readonly transporter;
    private readonly from;
    constructor(config: ConfigService);
    send({ to, subject, html }: SendMailInput): Promise<void>;
}
export {};
