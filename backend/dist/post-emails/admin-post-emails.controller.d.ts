import { DigestEmailsService } from './digest-emails.service.js';
export declare class AdminPostEmailsController {
    private readonly digests;
    constructor(digests: DigestEmailsService);
    stats(): Promise<import("./digest-emails.service.js").DigestStatsResponse>;
}
