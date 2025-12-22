import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, User as PrismaUser } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '../domain/models';

type SafeUser = Omit<PrismaUser, 'passwordHash'>;

@Injectable()
export class UsersService {
  private readonly userSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    createdAt: true,
    updatedAt: true,
    pushToken: true,
    notificationPreferences: true
  } satisfies Record<keyof SafeUser, boolean>;

  constructor(private prisma: PrismaService) {}

  sanitize(user: PrismaUser): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async create(dto: CreateUserDto): Promise<SafeUser> {
    const role = dto.role ?? UserRole.INDIVIDUAL;
    const email = dto.email.toLowerCase();
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email,
          phone: dto.phone,
          role,
          passwordHash
        }
      });
      return this.sanitize(user);
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Email already in use');
      }
      throw error;
    }
  }

  async findAll(): Promise<SafeUser[]> {
    return this.prisma.user.findMany({ select: this.userSelect });
  }

  async findById(id: string): Promise<SafeUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.sanitize(user) : null;
  }

  async findByEmail(email: string): Promise<PrismaUser | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async validateUser(email: string, password: string): Promise<SafeUser | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;
    return this.sanitize(user);
  }
}

