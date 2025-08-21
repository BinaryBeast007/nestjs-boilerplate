import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { HashingModule } from 'src/common/hashing/hashing.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule, HashingModule], 
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
