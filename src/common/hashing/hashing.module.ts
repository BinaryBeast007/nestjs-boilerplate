import { Module } from '@nestjs/common';
import { HashingService } from './hashing.service';
import { BcryptHashingService } from './implementations/bcrypt-hashing.service';

@Module({
  providers: [
    {
      provide: HashingService,
      useClass: BcryptHashingService,
    },
  ],
  exports: [HashingService],
})
export class HashingModule {}
