import type { MigrationInterface, QueryRunner } from 'typeorm';
export declare class DailyPrompts1790700000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
