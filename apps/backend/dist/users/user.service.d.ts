import { User as PrismaUser } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
type SafeUser = Omit<PrismaUser, 'passwordHash'>;
export declare class UsersService {
    private prisma;
    private readonly userSelect;
    constructor(prisma: PrismaService);
    sanitize(user: PrismaUser): SafeUser;
    create(dto: CreateUserDto): Promise<SafeUser>;
    findAll(): Promise<SafeUser[]>;
    findById(id: string): Promise<SafeUser | null>;
    findByEmail(email: string): Promise<PrismaUser | null>;
    validateUser(email: string, password: string): Promise<SafeUser | null>;
}
export {};
