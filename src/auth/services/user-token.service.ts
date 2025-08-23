import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User } from 'src/users/entities/user.entity';
import { UserToken } from '../entities/user-token.entity';
import { TokenType } from '../enums/token-type.enum';
import { UsersService } from 'src/users/services/users.service';
import { MailerService } from 'src/mailer/mailer.service';
import { plainToInstance } from 'class-transformer';
import { UserTokenDto } from '../dtos/user-token.dto';

@Injectable()
export class UserTokenService {
  constructor(
    @InjectRepository(UserToken)
    private readonly tokenRepository: Repository<UserToken>,
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService,
  ) {}

  async createToken(
    user: User,
    type: TokenType,
    expiresInMinutes: number = 60,
  ): Promise<string> {
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.tokenRepository.delete({
      user: { id: user.id },
      type,
    });

    const tokenStr = crypto.randomBytes(32).toString('hex');

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    const token = this.tokenRepository.create({
      token: tokenStr,
      type,
      expiresAt,
      user,
    });

    await this.tokenRepository.save(token);

    return tokenStr;
  }

  private async findTokenInternal(
    tokenStr: string,
    type?: TokenType,
  ): Promise<UserToken | null> {
    const where: any = { token: tokenStr };
    if (type) {
      where.type = type;
    }
    return this.tokenRepository.findOne({
      where,
      relations: ['user'],
    });
  }

  async findToken(
    tokenStr: string,
    type?: TokenType,
  ): Promise<UserTokenDto | null> {
    const token = await this.findTokenInternal(tokenStr, type);
    if (!token) {
      return null;
    }
    return plainToInstance(UserTokenDto, token);
  }

  async getUserIdByToken(
    tokenStr: string,
    type: TokenType,
  ): Promise<string | null> {
    const token = await this.tokenRepository.findOne({
      where: { token: tokenStr, type },
      select: ['userId'],
    });
    return token?.userId ?? null;
  }

  async requestToken(email: string, type: TokenType): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return;
    }

    if (type === TokenType.EMAIL_VERIFICATION && user.emailVerified) {
      return;
    }

    const token = await this.createToken(user, type);

    if (type === TokenType.EMAIL_VERIFICATION) {
      await this.mailerService.sendVerificationEmail(email, token);
    } else if (type === TokenType.PASSWORD_RESET) {
      await this.mailerService.sendPasswordResetEmail(email, token);
    } else {
      throw new BadRequestException('Unsupported token type');
    }
  }

  isTokenExpired(token: UserToken | UserTokenDto): boolean {
    return token.expiresAt < new Date();
  }

  async validateToken(
    tokenStr: string,
    type: TokenType,
  ): Promise<UserToken | null> {
    const token = await this.findTokenInternal(tokenStr, type);
    if (!token || this.isTokenExpired(token)) {
      return null;
    }
    return token;
  }

  async invalidateToken(tokenStr: string, type: TokenType): Promise<void> {
    const token = await this.findTokenInternal(tokenStr, type);
    if (token) {
      await this.tokenRepository.remove(token);
    }
  }
}
