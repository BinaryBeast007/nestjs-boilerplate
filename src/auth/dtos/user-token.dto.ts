import { Exclude } from 'class-transformer';
import { User } from 'src/users/entities/user.entity';
import { TokenType } from '../enums/token-type.enum';

export class UserTokenDto {
  id: string;
  token: string;
  type: TokenType;
  expiresAt: Date;
  createdAt: Date;
  userId: string;

  @Exclude()
  user: User;
}
