import type { MigrationInterface, QueryRunner } from 'typeorm';
export declare class Milestones1790800000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
