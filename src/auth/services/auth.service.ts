import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/services/users.service';
import { HashingService } from 'src/common/hashing/hashing.abstract';
import { RegisterDto } from '../dtos/register.dto';
import { RegisterResponseDto } from '../dtos/register-response.dto';
import { VerificationTokenService } from './verification-token.service';
import { MailerService } from 'src/mailer/mailer.service';
import { LoginDto } from '../dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from './refresh-token.service';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { PasswordResetTokenService } from './password-reset-token.service';
import { ResetPasswordDto } from '../dtos/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private readonly hashingService: HashingService,
    private readonly verificationTokenService: VerificationTokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly passwordResetTokenService: PasswordResetTokenService,
    private mailerService: MailerService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await this.hashingService.hash(registerDto.password);

    const user = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      emailVerified: false,
    });

    const verificationToken =
      await this.verificationTokenService.createVerificationToken(user);

    await this.mailerService.sendVerificationEmail(
      user.email,
      verificationToken,
    );

    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
    };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (
      !user ||
      !(await this.hashingService.compare(loginDto.password, user.password))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException('Email not verified');
    }
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
    const refreshToken =
      await this.refreshTokenService.createRefreshToken(user);

    return { accessToken, refreshToken: refreshToken };
  }

  async verifyEmail(token: string): Promise<void> {
    const verificationToken =
      await this.verificationTokenService.findVerificationToken(token);

    const user = verificationToken?.user;
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    user.emailVerified = true;
    await this.verificationTokenService.invalidateVerificationToken(
      verificationToken.token,
    );
    await this.usersService.updateEmailVerified(user);
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (
      !user ||
      !(await this.hashingService.compare(
        changePasswordDto.oldPassword,
        user.password,
      ))
    ) {
      throw new UnauthorizedException('Invalid old password');
    }
    const updatedUser = { password: changePasswordDto.newPassword };
    await this.usersService.update(userId, updatedUser);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (user) {
      const resetToken =
        await this.passwordResetTokenService.createResetToken(user);
      await this.mailerService.sendPasswordResetEmail(user.email, resetToken);
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const userId = await this.passwordResetTokenService.findUserIdByResetToken(
      resetPasswordDto.token,
    );

    if (!userId) {
      throw new NotFoundException('Invalid or expired password reset token');
    }

    await this.usersService.update(userId, {
      password: resetPasswordDto.newPassword,
    });

    await this.passwordResetTokenService.invalidateResetToken(
      resetPasswordDto.token,
    );
  }
}
