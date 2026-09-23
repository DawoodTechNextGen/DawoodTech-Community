import type { MigrationInterface, QueryRunner } from 'typeorm';
export declare class PostEmailNotifications1790136000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
