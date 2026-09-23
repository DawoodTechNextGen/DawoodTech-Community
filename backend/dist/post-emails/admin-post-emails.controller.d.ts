import { PostEmailsService } from './post-emails.service.js';
export declare class AdminPostEmailsController {
    private readonly postEmails;
    constructor(postEmails: PostEmailsService);
    stats(): Promise<{
        mode: import("./post-emails.service.js").PostEmailMode;
        posts: import("./post-emails.service.js").PostEmailStats[];
    }>;
}
