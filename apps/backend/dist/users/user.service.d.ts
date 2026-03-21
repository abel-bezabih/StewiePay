import { Prisma, User as PrismaUser } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { StorageService } from '../storage/storage.service';
type SafeUser = Omit<PrismaUser, 'passwordHash'>;
export type PaymentAccessTier = 'FULL' | 'LIMITED';
export declare class UsersService {
    private prisma;
    private storageService;
    private readonly userSelect;
    constructor(prisma: PrismaService, storageService: StorageService);
    private isKycAutoReviewEnabled;
    private getKycAutoReviewProvider;
    private getKycAutoReviewHttpFailMode;
    private getKycAutoReviewMode;
    private normalizeBase64;
    private decodeBase64ToBuffer;
    private estimateBase64Bytes;
    private detectImageFormat;
    private sha256Base64;
    private parseCsvSet;
    private getStoredKycHashes;
    private findDuplicateFingerprint;
    private requestHttpAutoReviewDecision;
    private evaluateAutomatedKycDecision;
    private getOrCreateKycAutomationReviewerId;
    sanitize(user: PrismaUser): SafeUser;
    create(dto: CreateUserDto): Promise<SafeUser>;
    findAll(): Promise<SafeUser[]>;
    findById(id: string): Promise<SafeUser | null>;
    findByEmail(email: string): Promise<PrismaUser | null>;
    validateUser(email: string, password: string): Promise<SafeUser | null>;
    updateProfile(id: string, dto: {
        name?: string;
        email?: string;
        phone?: string;
        avatarUrl?: string;
    }): Promise<SafeUser>;
    changePassword(id: string, currentPassword: string, newPassword: string): Promise<void>;
    updatePasswordByEmail(email: string, newPassword: string): Promise<void>;
    markEmailVerified(userId: string): Promise<void>;
    assertPaymentKycEligible(userId: string, actionLabel?: string, options?: {
        allowSubmittedWithLimits?: boolean;
    }): Promise<{
        tier: PaymentAccessTier;
        kycStatus: SafeUser['kycStatus'];
    }>;
    uploadAvatar(userId: string, base64Image: string): Promise<SafeUser>;
    submitKyc(userId: string, payload: {
        documentType: 'passport' | 'national_id' | 'driver_license';
        country: string;
        documentFront: string;
        documentBack?: string;
        selfie: string;
    }): Promise<SafeUser>;
    getKycStatus(userId: string): Promise<{
        latestReview: {
            id: string;
            createdAt: Date;
            rejectionReason: string | null;
            reviewNote: string | null;
            reviewerId: string;
            previousStatus: import(".prisma/client").$Enums.KycStatus;
            newStatus: import(".prisma/client").$Enums.KycStatus;
            reviewer: {
                name: string;
                email: string;
                id: string;
            };
        } | null;
        kycStatus: import(".prisma/client").$Enums.KycStatus;
        kycSubmittedAt: Date | null;
        kycVerifiedAt: Date | null;
        kycRejectionReason: string | null;
    }>;
    listKycSubmissions(): Promise<{
        name: string;
        email: string;
        phone: string | null;
        id: string;
        kycStatus: import(".prisma/client").$Enums.KycStatus;
        kycSubmittedAt: Date | null;
        kycVerifiedAt: Date | null;
        kycRejectionReason: string | null;
        kycDocuments: Prisma.JsonValue;
    }[]>;
    updateKycStatus(userId: string, payload: {
        status: 'VERIFIED' | 'REJECTED';
        rejectionReason?: string;
        reviewNote?: string;
    }, reviewer: {
        reviewerId: string;
        reviewerIp?: string;
        reviewerUserAgent?: string;
    }): Promise<{
        name: string;
        email: string;
        id: string;
        kycStatus: import(".prisma/client").$Enums.KycStatus;
        kycVerifiedAt: Date | null;
        kycRejectionReason: string | null;
    }>;
    listKycReviews(userId: string, options?: {
        limit?: number;
        cursor?: string;
        status?: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
        startDate?: string;
        endDate?: string;
        reviewerEmail?: string;
    }): Promise<{
        items: {
            id: string;
            createdAt: Date;
            rejectionReason: string | null;
            reviewNote: string | null;
            previousStatus: import(".prisma/client").$Enums.KycStatus;
            newStatus: import(".prisma/client").$Enums.KycStatus;
            reviewerIp: string | null;
            reviewerUserAgent: string | null;
            reviewer: {
                name: string;
                email: string;
                id: string;
            };
        }[];
        nextCursor: string | null;
    }>;
    exportKycReviewsCsv(userId: string, options?: {
        status?: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
        startDate?: string;
        endDate?: string;
        reviewerEmail?: string;
    }): Promise<string>;
    exportAllKycReviewsCsv(options?: {
        status?: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
        startDate?: string;
        endDate?: string;
        reviewerEmail?: string;
        subjectEmail?: string;
    }): Promise<string>;
}
export {};
