import { IsNotEmpty, IsString } from 'class-validator';

export class VerificationTokenDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}
