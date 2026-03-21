import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    private resolveBackendPublicUrl;
    signup(req: any, dto: CreateUserDto): Promise<{
        verificationToken?: string | undefined;
        user: {
            name: string;
            email: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            avatarUrl: string | null;
            id: string;
            emailVerified: boolean;
            emailVerifiedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            pushToken: string | null;
            notificationPreferences: import("@prisma/client/runtime/library").JsonValue | null;
            kycStatus: import(".prisma/client").$Enums.KycStatus;
            kycSubmittedAt: Date | null;
            kycVerifiedAt: Date | null;
            kycRejectionReason: string | null;
            kycDocuments: import("@prisma/client/runtime/library").JsonValue | null;
        };
        requiresEmailVerification: boolean;
        message: string;
    }>;
    login(dto: LoginDto): Promise<{
        token: string;
        refreshToken: string;
        user: {
            name: string;
            email: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            avatarUrl: string | null;
            id: string;
            emailVerified: boolean;
            emailVerifiedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            pushToken: string | null;
            notificationPreferences: import("@prisma/client/runtime/library").JsonValue | null;
            kycStatus: import(".prisma/client").$Enums.KycStatus;
            kycSubmittedAt: Date | null;
            kycVerifiedAt: Date | null;
            kycRejectionReason: string | null;
            kycDocuments: import("@prisma/client/runtime/library").JsonValue | null;
        };
    }>;
    refresh(dto: RefreshTokenDto): Promise<{
        user: {
            name: string;
            email: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            avatarUrl: string | null;
            id: string;
            emailVerified: boolean;
            emailVerifiedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            pushToken: string | null;
            notificationPreferences: import("@prisma/client/runtime/library").JsonValue | null;
            kycStatus: import(".prisma/client").$Enums.KycStatus;
            kycSubmittedAt: Date | null;
            kycVerifiedAt: Date | null;
            kycRejectionReason: string | null;
            kycDocuments: import("@prisma/client/runtime/library").JsonValue | null;
        };
        token: string;
        refreshToken: string;
    }>;
    me(req: any): Promise<{
        name: string;
        email: string;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        avatarUrl: string | null;
        id: string;
        emailVerified: boolean;
        emailVerifiedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        pushToken: string | null;
        notificationPreferences: import("@prisma/client/runtime/library").JsonValue | null;
        kycStatus: import(".prisma/client").$Enums.KycStatus;
        kycSubmittedAt: Date | null;
        kycVerifiedAt: Date | null;
        kycRejectionReason: string | null;
        kycDocuments: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    logout(dto: RefreshTokenDto): Promise<{
        success: boolean;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
        resetToken?: undefined;
    } | {
        message: string;
        resetToken: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    verifyEmail(dto: VerifyEmailDto): Promise<{
        message: string;
    }>;
    verifyEmailGet(token: string): Promise<{
        message: string;
    }>;
    resendVerification(req: any, dto: ResendVerificationDto): Promise<{
        verificationToken?: string | undefined;
        message: string;
    }>;
}
