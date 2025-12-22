import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/user.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RefreshTokenService } from './refresh-token.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
export declare class AuthService {
    private usersService;
    private jwtService;
    private refreshTokens;
    constructor(usersService: UsersService, jwtService: JwtService, refreshTokens: RefreshTokenService);
    /**
     * Enhanced signup with security checks
     */
    signup(dto: CreateUserDto): Promise<{
        message: string;
        token: string;
        refreshToken: string;
        user: {
            name: string;
            email: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            pushToken: string | null;
            notificationPreferences: import("@prisma/client/runtime/library").JsonValue | null;
        };
    }>;
    /**
     * Validate signup data for security
     */
    private validateSignupData;
    login(dto: LoginDto): Promise<{
        token: string;
        refreshToken: string;
        user: {
            name: string;
            email: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            pushToken: string | null;
            notificationPreferences: import("@prisma/client/runtime/library").JsonValue | null;
        };
    }>;
    private signToken;
    private issueTokens;
    me(userId: string): Promise<{
        name: string;
        email: string;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        pushToken: string | null;
        notificationPreferences: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    refresh(dto: RefreshTokenDto): Promise<{
        user: {
            name: string;
            email: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            pushToken: string | null;
            notificationPreferences: import("@prisma/client/runtime/library").JsonValue | null;
        };
        token: string;
        refreshToken: string;
    }>;
    logout(refreshToken: string): Promise<{
        success: boolean;
    }>;
}
