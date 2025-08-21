import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { HashingService } from 'src/common/hashing/hashing.abstract';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly hashingService: HashingService,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return await this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      return null;
    }
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingUser) {
        throw new UnprocessableEntityException({
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message: 'Validation Failed',
          errors: { email: 'emailAlreadyExists' },
        });
      }
    }
    if (updateUserDto.password) {
      updateUserDto.password = await this.hashingService.hash(
        updateUserDto.password,
      );
    }

    Object.assign(user, updateUserDto);
    return await this.usersRepository.save(user);
  }

  async updateEmailVerified(user: User): Promise<User | null> {
    return await this.usersRepository.save(user);
  }
}
