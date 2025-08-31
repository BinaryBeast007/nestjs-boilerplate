import {
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
    try {
      const user = this.usersRepository.create(userData);
      return await this.usersRepository.save(user);
    } catch (error) {
      throw new UnprocessableEntityException('Failed to create user');
    }
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
        'user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search', // Changed to ILIKE for case-insensitive search
        { search: `%${search}%` },
      );
    }
    try {
      const [users, total] = await query
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();
      return { users, total };
    } catch (error) {
      throw new UnprocessableEntityException('Failed to fetch users');
    }
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

    try {
      Object.assign(user, updateUserDto);
      return await this.usersRepository.save(user);
    } catch (error) {
      throw new UnprocessableEntityException('Failed to update user');
    }
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    try {
      await this.usersRepository.softDelete(id);
    } catch (error) {
      throw new UnprocessableEntityException('Failed to delete user');
    }
  }

  async updateEmailVerified(
    updateEmailVerifiedDto: UpdateEmailVerifiedDto,
  ): Promise<void> {
    try {
      const result = await this.usersRepository.update(
        updateEmailVerifiedDto.userId,
        { emailVerified: updateEmailVerifiedDto.emailVerified },
      );
      if (result.affected === 0) {
        throw new NotFoundException(
          `User with id ${updateEmailVerifiedDto.userId} not found`,
        );
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new UnprocessableEntityException(
        'Failed to update email verification status',
      );
    }
  }

  async findByProviderId(
    provider: string,
    providerId: string,
  ): Promise<User | null> {
    return this.usersRepository.findOneBy({ provider, providerId });
  }
}
