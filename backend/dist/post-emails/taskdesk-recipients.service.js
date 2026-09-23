var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TaskdeskRecipientsService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isEmail } from 'class-validator';
import mysql from 'mysql2/promise';
import { normalizeEmail } from './email-worker-utils.js';
const INTERN_ROLES = [2, 6];
const ACTIVE_USER_STATUS = 1;
const HIRED_REGISTRATION_STATUS = 'hire';
let TaskdeskRecipientsService = TaskdeskRecipientsService_1 = class TaskdeskRecipientsService {
    config;
    logger = new Logger(TaskdeskRecipientsService_1.name);
    pool = null;
    constructor(config) {
        this.config = config;
    }
    getPool() {
        this.pool ??= mysql.createPool({
            host: this.config.get('taskdeskDb.host'),
            port: this.config.get('taskdeskDb.port'),
            user: this.config.get('taskdeskDb.user'),
            password: this.config.get('taskdeskDb.password'),
            database: this.config.get('taskdeskDb.database'),
            connectionLimit: 2,
        });
        return this.pool;
    }
    async fetchRecipients() {
        const [rows] = await this.getPool().query(`SELECT name, email FROM registrations WHERE status = ?
       UNION ALL
       SELECT name, email FROM users
       WHERE user_role IN (?)
         AND (status = ?
              OR id IN (SELECT intern_id FROM certificate WHERE approve_status = 1))`, [HIRED_REGISTRATION_STATUS, INTERN_ROLES, ACTIVE_USER_STATUS]);
        return dedupeRecipients(rows);
    }
    async onModuleDestroy() {
        await this.pool?.end().catch((err) => this.logger.warn(`Closing pool: ${err}`));
    }
};
TaskdeskRecipientsService = TaskdeskRecipientsService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], TaskdeskRecipientsService);
export { TaskdeskRecipientsService };
export function dedupeRecipients(rows) {
    const byEmail = new Map();
    for (const row of rows) {
        const email = normalizeEmail(row.email ?? '');
        if (!email || !isEmail(email))
            continue;
        const name = row.name?.trim() || null;
        const existing = byEmail.get(email);
        if (!existing)
            byEmail.set(email, { email, name });
        else if (!existing.name && name)
            existing.name = name;
    }
    return [...byEmail.values()];
}
//# sourceMappingURL=taskdesk-recipients.service.js.map