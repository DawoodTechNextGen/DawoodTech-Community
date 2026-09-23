var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../database/entities/post.entity.js';
import { PostEmailQueue } from '../database/entities/post-email-queue.entity.js';
import { User } from '../database/entities/user.entity.js';
import { MailModule } from '../mail/mail.module.js';
import { AdminPostEmailsController } from './admin-post-emails.controller.js';
import { PostEmailsService } from './post-emails.service.js';
import { TaskdeskRecipientsService } from './taskdesk-recipients.service.js';
let PostEmailsModule = class PostEmailsModule {
};
PostEmailsModule = __decorate([
    Module({
        imports: [
            TypeOrmModule.forFeature([Post, PostEmailQueue, User]),
            MailModule,
        ],
        controllers: [AdminPostEmailsController],
        providers: [PostEmailsService, TaskdeskRecipientsService],
        exports: [PostEmailsService, TaskdeskRecipientsService],
    })
], PostEmailsModule);
export { PostEmailsModule };
//# sourceMappingURL=post-emails.module.js.map