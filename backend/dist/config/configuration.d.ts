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
    smtp: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        pass: string;
        from: string;
    };
};
export default _default;
