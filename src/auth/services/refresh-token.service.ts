import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { User } from 'src/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
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

  async refresh(
    oldRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshTokenEntity = await this.refreshTokenRepository.findOne({
      where: { token: oldRefreshToken, expiresAt: MoreThan(new Date()) },
      relations: ['user'],
    });

    if (!refreshTokenEntity) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = refreshTokenEntity.user;

    await this.refreshTokenRepository.remove(refreshTokenEntity);

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
    const newRefreshToken = await this.createRefreshToken(user);

    return { accessToken, refreshToken: newRefreshToken };
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
