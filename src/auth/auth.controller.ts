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
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
import { RefreshGuard } from './guards/refresh.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly userTokenService: UserTokenService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login a user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User logged in successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Email not verified',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @UseGuards(RefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens refreshed successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid refresh token',
  })
  async refresh(@Body() refreshDto: RefreshDto) {
    return this.refreshTokenService.refresh(refreshDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(RefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout by invalidating refresh token' })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logged out successfully',
  })
  async logout(@Body() refreshDto: RefreshDto) {
    await this.refreshTokenService.invalidateRefreshToken(
      refreshDto.refreshToken,
    );
    return { message: 'Logged out successfully' };
  }

  @Get('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email using token' })
  @ApiQuery({ name: 'token', type: String, description: 'Verification token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired token',
  })
  async verify(@Query() verificationTokenDto: VerificationTokenDto) {
    await this.authService.verifyEmail(verificationTokenDto.token);
    return { message: 'Email verified successfully' };
  }

  @Post('verify/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification' })
  @ApiBody({ type: ResendVerificationDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification email sent if applicable',
  })
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
  @ApiOperation({ summary: 'Change user password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid old password',
  })
  async changePassword(
    @Req() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(req.user.id, changePasswordDto);
    return { message: 'Password changed successfully' };
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset email sent if applicable',
  })
  async forgot(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return {
      message:
        'If an account exists with this email, a password reset email has been sent.',
    };
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invalid or expired token',
  })
  async reset(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'Password reset successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User profile retrieved' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async me(@Req() req: any) {
    return this.authService.getProfile(req.user.id);
  }
}
