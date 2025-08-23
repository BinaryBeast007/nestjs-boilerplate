import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RegisterDto } from './dtos/register.dto';
import { AuthService } from './services/auth.service';
import { LoginDto } from './dtos/login.dto';
import { RefreshDto } from './dtos/refresh.dto';
import { RefreshTokenService } from './services/refresh-token.service';
import { VerificationTokenDto } from './dtos/verification-token.dto';
import { ResendVerificationDto } from './dtos/resend-verification.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { UserTokenService } from './services/user-token.service';
import { TokenType } from './enums/token-type.enum';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly userTokenService: UserTokenService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshDto: RefreshDto) {
    return this.refreshTokenService.refresh(refreshDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() refreshDto: RefreshDto) {
    await this.refreshTokenService.invalidateRefreshToken(
      refreshDto.refreshToken,
    );
    return { message: 'Logged out successfully' };
  }

  @Get('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Query() verificationTokenDto: VerificationTokenDto) {
    await this.authService.verifyEmail(verificationTokenDto.token);
    return { message: 'Email verified successfully' };
  }

  @Post('verify/resend')
  @HttpCode(HttpStatus.OK)
  async resend(@Body() resendVerificationDto: ResendVerificationDto) {
    await this.userTokenService.requestToken(
      resendVerificationDto.email,
      TokenType.EMAIL_VERIFICATION,
    );
    return {
      message:
        'If an account exists with this email and is not verified, a verification email has been sent.',
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(req.user.id, changePasswordDto);
    return { message: 'Password changed successfully' };
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  async forgot(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return {
      message:
        'If an account exists with this email, a password reset email has been sent.',
    };
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  async reset(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'Password reset successfully' };
  }
}
