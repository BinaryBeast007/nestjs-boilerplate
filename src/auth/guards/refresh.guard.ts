import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { RefreshTokenService } from '../services/refresh-token.service';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable()
export class RefreshGuard implements CanActivate {
  constructor(private readonly refreshTokenService: RefreshTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { refreshToken } = request.body;

    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const user: RefreshToken | null =
      await this.refreshTokenService.validateRefreshToken(refreshToken);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    request.user = user;
    return true;
  }
}
