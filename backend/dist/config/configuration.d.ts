declare const _default: () => {
    nodeEnv: string;
    port: number;
    db: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
    };
    jwt: {
        accessSecret: string;
        accessExpiresIn: string;
        refreshSecret: string;
        refreshExpiresIn: string;
        emailTokenSecret: string;
    };
    corsOrigins: string[];
    frontendUrl: string;
    communityUrl: string;
    apiPublicUrl: string;
    smtp: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        pass: string;
        from: string | {
            name: string;
            address: string;
        };
    };
    taskdeskDb: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
    };
    postEmails: {
        mode: "live" | "test" | "dry_run";
        testRecipient: string;
        batchSize: number;
        delayMs: number;
        maxAttempts: number;
        activityMode: "live" | "test" | "dry_run";
    };
};
export default _default;
