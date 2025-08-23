import { IsUUID, IsBoolean } from 'class-validator';

export class UpdateEmailVerifiedDto {
  @IsUUID()
  userId: string;

  @IsBoolean()
  emailVerified: boolean;
}
