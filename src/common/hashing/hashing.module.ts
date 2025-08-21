import { Module } from '@nestjs/common';
import { BcryptHashingService } from './implementations/bcrypt-hashing.service';
import { HashingService } from './hashing.abstract';

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
