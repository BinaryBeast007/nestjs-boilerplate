import {
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { HashingService } from 'src/common/hashing/hashing.abstract';
import { PaginationDto } from '../dtos/pagination.dto';
import { UpdateEmailVerifiedDto } from '../dtos/update-email-verified.dto';

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

  async findById(id: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<{ users: User[]; total: number }> {
    const { page, limit, search } = paginationDto;
    const query = this.usersRepository.createQueryBuilder('user');
    if (search) {
      query.where(
        'user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search',
        { search: `%${search}%` },
      );
    }
    const [users, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { users, total };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      return null;
    }

    if (updateUserDto.password) {
      updateUserDto.password = await this.hashingService.hash(
        updateUserDto.password,
      );
    }

    Object.assign(user, updateUserDto);
    return await this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    await this.usersRepository.softDelete(id);
  }

  async updateEmailVerified(
    updateEmailVerifiedDto: UpdateEmailVerifiedDto,
  ): Promise<void> {
    await this.usersRepository.update(updateEmailVerifiedDto.userId, {
      emailVerified: updateEmailVerifiedDto.emailVerified,
    });
  }

  async findByProviderId(
    provider: string,
    providerId: string,
  ): Promise<User | null> {
    return this.usersRepository.findOneBy({ provider, providerId });
  }
}
