import { ConflictException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/services/users.service';
import { HashingService } from 'src/common/hashing/hashing.abstract';
import { RegisterDto } from '../dtos/register.dto';
import { RegisterResponseDto } from '../dtos/register-response.dto';
import { VerificationTokenService } from './verification-token.service';
import { MailerService } from 'src/mailer/mailer.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private readonly hashingService: HashingService,
    private readonly verificationTokenService: VerificationTokenService,
    private mailerService: MailerService,
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
}
