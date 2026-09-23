import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

type MailFrom = string | { name: string; address: string };

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: MailFrom;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('smtp.host');
    this.from = this.config.get<MailFrom>('smtp.from')!;

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

  get isConfigured(): boolean {
    return this.transporter !== null;
  }

  async send({ to, subject, html, text, headers }: SendMailInput): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `SMTP not configured — logging email instead of sending.\n` +
          `To: ${to}\nSubject: ${subject}\n${text ?? stripHtml(html)}\n`,
      );
      return;
    }

    await this.transporter.sendMail({ from: this.from, to, subject, html, text, headers });
  }

  /** Closes pooled SMTP connections, so a one-shot CLI run can exit cleanly. */
  close(): void {
    this.transporter?.close();
  }
}

function stripHtml(html: string): string {
  const linkMatch = /href="([^"]+)"/.exec(html);
  return linkMatch ? `Link: ${linkMatch[1]}` : html.replace(/<[^>]+>/g, ' ').trim();
}
