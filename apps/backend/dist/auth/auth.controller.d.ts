import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    me(req: any): Promise<{
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
    logout(dto: RefreshTokenDto): Promise<{
        success: boolean;
    }>;
}
