import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { HashingModule } from 'src/common/hashing/hashing.module';
import { UsersModule } from 'src/users/users.module';
import { MailerModule } from 'src/mailer/mailer.module';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { VerificationToken } from './entities/verification-token.entity';
import { PasswordResetTokenService } from './services/password-reset-token.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { VerificationTokenService } from './services/verification-token.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PasswordResetToken]),
    TypeOrmModule.forFeature([RefreshToken]),
    TypeOrmModule.forFeature([VerificationToken]),
    HashingModule,
    UsersModule,
    MailerModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordResetTokenService,
    RefreshTokenService,
    VerificationTokenService,
  ],
})
export class AuthModule {}
