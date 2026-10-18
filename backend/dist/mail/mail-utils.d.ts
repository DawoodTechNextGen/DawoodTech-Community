import type { DataSource } from 'typeorm';
export declare function withAdvisoryLock<T>(dataSource: DataSource, lockName: string, fn: () => Promise<T>): Promise<T | null>;
export declare function emailsSentInLastHour(dataSource: DataSource): Promise<number>;
export declare function hourlyAllowance(dataSource: DataSource, hourlyLimit: number): Promise<number>;
export declare function errorMessage(err: unknown): string;
export declare function escapeHtml(value: string): string;
