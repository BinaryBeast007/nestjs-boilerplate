import { IsBoolean, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RegisterResponseDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsBoolean()
  emailVerified: boolean;
}
