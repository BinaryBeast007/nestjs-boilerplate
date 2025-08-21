import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { PasswordResetToken } from 'src/auth/entities/password-reset-token.entity';
import { VerificationToken } from 'src/auth/entities/verification-token.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 320, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 128 })
  @Exclude()
  password: string;

  @Column({ type: 'varchar', length: 96 })
  firstName: string;

  @Column({ type: 'varchar', length: 96 })
  lastName: string;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  provider: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  providerId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(
    () => PasswordResetToken,
    (passwordResetToken) => passwordResetToken.user,
  )
  passwordResetTokens: PasswordResetToken[];

  @OneToMany(
    () => VerificationToken,
    (verificationToken) => verificationToken.user,
  )
  verificationTokens: VerificationToken[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];
}
