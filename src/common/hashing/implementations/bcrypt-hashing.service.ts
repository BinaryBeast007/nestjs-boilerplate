import * as bcrypt from 'bcrypt';
import { HashingService } from '../hashing.abstract';

export class BcryptHashingService extends HashingService {
  private readonly saltRounds: number;

  constructor(saltRounds: number = 10) {
    super();
    this.saltRounds = saltRounds;
  }

  async hash(data: string): Promise<string> {
    return await bcrypt.hash(data, this.saltRounds);
  }

  async compare(data: string, encrypted: string): Promise<boolean> {
    return await bcrypt.compare(data, encrypted);
  }
}
