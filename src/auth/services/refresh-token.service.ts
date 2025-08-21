import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async createRefreshToken(
    user: User,
    expiresInDays: number = 7,
  ): Promise<string> {
    const tokenStr = crypto.randomBytes(64).toString('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const refreshToken = this.refreshTokenRepository.create({
      token: tokenStr,
      expiresAt,
      user,
    });

    await this.refreshTokenRepository.save(refreshToken);

    return tokenStr;
  }

  async findRefreshToken(tokenStr: string): Promise<RefreshToken | null> {
    return this.refreshTokenRepository.findOne({
      where: { token: tokenStr },
      relations: ['user'],
    });
  }

  isTokenExpired(token: RefreshToken): boolean {
    return token.expiresAt < new Date();
  }

  async validateRefreshToken(tokenStr: string): Promise<RefreshToken | null> {
    const token = await this.findRefreshToken(tokenStr);
    if (!token || this.isTokenExpired(token)) {
      return null;
    }
    return token;
  }

  async invalidateRefreshToken(tokenStr: string): Promise<void> {
    const token = await this.findRefreshToken(tokenStr);
    if (token) {
      await this.refreshTokenRepository.remove(token);
    }
  }

  async invalidateAllForUser(user: User): Promise<void> {
    await this.refreshTokenRepository.delete({ user: { id: user.id } });
  }
}
