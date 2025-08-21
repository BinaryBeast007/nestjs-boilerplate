import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(96)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(96)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @IsOptional()
  @MinLength(8)
  @MaxLength(128)
  password?: string;
}
