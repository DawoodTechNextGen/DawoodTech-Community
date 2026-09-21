import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('smtp.host');
    this.from = this.config.get<string>('smtp.from')!;

    this.transporter = host
      ? nodemailer.createTransport({
          host,
          port: this.config.get<number>('smtp.port'),
          secure: this.config.get<boolean>('smtp.secure'),
          auth: {
            user: this.config.get<string>('smtp.user'),
            pass: this.config.get<string>('smtp.pass'),
          },
        })
      : null;
  }

  async send({ to, subject, html }: SendMailInput): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `SMTP not configured — logging email instead of sending.\n` +
          `To: ${to}\nSubject: ${subject}\n${stripHtml(html)}\n`,
      );
      return;
    }

    await this.transporter.sendMail({ from: this.from, to, subject, html });
  }
}

function stripHtml(html: string): string {
  const linkMatch = /href="([^"]+)"/.exec(html);
  return linkMatch ? `Link: ${linkMatch[1]}` : html.replace(/<[^>]+>/g, ' ').trim();
}
