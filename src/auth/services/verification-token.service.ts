import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User } from 'src/users/entities/user.entity';
import { VerificationToken } from '../entities/verification-token.entity';
import { UsersService } from 'src/users/services/users.service';
import { MailerService } from 'src/mailer/mailer.service';

@Injectable()
export class VerificationTokenService {
  constructor(
    @InjectRepository(VerificationToken)
    private readonly tokenRepository: Repository<VerificationToken>,
    private usersService: UsersService,
    private mailerService: MailerService,
  ) {}

  async createVerificationToken(
    user: User,
    expiresInMinutes: number = 60,
  ): Promise<string> {
    await this.tokenRepository.delete({
      user: { id: user.id },
    });

    const tokenStr = crypto.randomBytes(32).toString('hex');

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    const token = this.tokenRepository.create({
      token: tokenStr,
      expiresAt,
      user,
    });

    await this.tokenRepository.save(token);

    return tokenStr;
  }

  async findVerificationToken(
    tokenStr: string,
  ): Promise<VerificationToken | null> {
    return this.tokenRepository.findOne({
      where: {
        token: tokenStr,
      },
      relations: ['user'],
    });
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (user && !user.emailVerified) {
      const verificationToken = await this.createVerificationToken(user);
      await this.mailerService.sendVerificationEmail(
        user.email,
        verificationToken,
      );
    }
  }

  isTokenExpired(token: VerificationToken): boolean {
    return token.expiresAt < new Date();
  }

  async validateVerificationToken(
    tokenStr: string,
  ): Promise<VerificationToken | null> {
    const token = await this.findVerificationToken(tokenStr);
    if (!token || this.isTokenExpired(token)) {
      return null;
    }
    return token;
  }

  async invalidateVerificationToken(tokenStr: string): Promise<void> {
    const token = await this.findVerificationToken(tokenStr);
    if (token) {
      await this.tokenRepository.remove(token);
    }
  }
}
