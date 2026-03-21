import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/user.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RefreshTokenService } from './refresh-token.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthService {
    private usersService;
    private jwtService;
    private refreshTokens;
    private emailService;
    constructor(usersService: UsersService, jwtService: JwtService, refreshTokens: RefreshTokenService, emailService: EmailService);
    private getJwtSecret;
    /**
     * Enhanced signup with security checks
     */
    signup(dto: CreateUserDto, backendPublicUrlOverride?: string): Promise<{
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
    private signEmailVerificationToken;
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    resendVerificationEmail(email: string, backendPublicUrlOverride?: string): Promise<{
        verificationToken?: string | undefined;
        message: string;
    }>;
    private signToken;
    private issueTokens;
    me(userId: string): Promise<{
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
    logout(refreshToken: string): Promise<{
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
}
