var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MailService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
let MailService = MailService_1 = class MailService {
    config;
    logger = new Logger(MailService_1.name);
    transporter;
    from;
    constructor(config) {
        this.config = config;
        const host = this.config.get('smtp.host');
        this.from = this.config.get('smtp.from');
        this.transporter = host
            ? nodemailer.createTransport({
                host,
                port: this.config.get('smtp.port'),
                secure: this.config.get('smtp.secure'),
                auth: {
                    user: this.config.get('smtp.user'),
                    pass: this.config.get('smtp.pass'),
                },
            })
            : null;
    }
    get isConfigured() {
        return this.transporter !== null;
    }
    async send({ to, subject, html, text, headers }) {
        if (!this.transporter) {
            this.logger.warn(`SMTP not configured — logging email instead of sending.\n` +
                `To: ${to}\nSubject: ${subject}\n${text ?? stripHtml(html)}\n`);
            return;
        }
        await this.transporter.sendMail({ from: this.from, to, subject, html, text, headers });
    }
    close() {
        this.transporter?.close();
    }
};
MailService = MailService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], MailService);
export { MailService };
function stripHtml(html) {
    const linkMatch = /href="([^"]+)"/.exec(html);
    return linkMatch ? `Link: ${linkMatch[1]}` : html.replace(/<[^>]+>/g, ' ').trim();
}
//# sourceMappingURL=mail.service.js.map