import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User } from 'src/users/entities/user.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';

@Injectable()
export class PasswordResetTokenService {
  constructor(
    @InjectRepository(PasswordResetToken)
    private readonly tokenRepository: Repository<PasswordResetToken>,
  ) {}

  async createResetToken(
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

  async findResetToken(tokenStr: string): Promise<PasswordResetToken | null> {
    return this.tokenRepository.findOne({
      where: {
        token: tokenStr,
      },
      relations: ['user'],
    });
  }

  isTokenExpired(token: PasswordResetToken): boolean {
    return token.expiresAt < new Date();
  }

  async validateResetToken(
    tokenStr: string,
  ): Promise<PasswordResetToken | null> {
    const token = await this.findResetToken(tokenStr);
    if (!token || this.isTokenExpired(token)) {
      return null;
    }
    return token;
  }

  async invalidateResetToken(tokenStr: string): Promise<void> {
    const token = await this.findResetToken(tokenStr);
    if (token) {
      await this.tokenRepository.remove(token);
    }
  }
}
