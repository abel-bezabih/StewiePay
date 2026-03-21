import { NotificationService } from './notification.service';
export declare class NotificationController {
    private readonly notificationService;
    constructor(notificationService: NotificationService);
    registerToken(req: any, body: {
        token: string;
    }): Promise<{
        name: string;
        email: string;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        avatarUrl: string | null;
        id: string;
        passwordHash: string;
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
    updatePreferences(req: any, preferences: {
        transactions?: boolean;
        limits?: boolean;
        cardStatus?: boolean;
    }): Promise<{
        name: string;
        email: string;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        avatarUrl: string | null;
        id: string;
        passwordHash: string;
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
}
