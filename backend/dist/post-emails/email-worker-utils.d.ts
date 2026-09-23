import type { DataSource } from 'typeorm';
export declare function normalizeEmail(email: string): string;
export declare function withAdvisoryLock<T>(dataSource: DataSource, lockName: string, fn: () => Promise<T>): Promise<T | null>;
export declare function toAbsoluteUrl(apiUrl: string, url: string | null | undefined): string | null;
export declare function errorMessage(err: unknown): string;
export declare function sleep(ms: number): Promise<void>;
