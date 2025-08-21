import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const apiUrl = this.configService.get<string>(
      'API_URL',
      'http://localhost:3000',
    );
    const verificationUrl = `${apiUrl}/auth/verify?token=${token}`;

    await this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_FROM'),
      to,
      subject: 'Verify Your Email',
      html: `<p>Please click the following link to verify your email:</p><a href="${verificationUrl}">${verificationUrl}</a>`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const apiUrl = this.configService.get<string>(
      'API_URL',
      'http://localhost:3000',
    );
    const resetUrl = `${apiUrl}/auth/password/reset?token=${token}`; // Assuming frontend handles the POST

    await this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_FROM'),
      to,
      subject: 'Reset Your Password',
      html: `<p>Please use the following link to reset your password:</p><a href="${resetUrl}">${resetUrl}</a>`,
    });
  }
}
