import { PrismaService } from '../prisma/prisma.service';
export interface NotificationPayload {
    title: string;
    body: string;
    data?: Record<string, any>;
}
export declare class NotificationService {
    private prisma;
    constructor(prisma: PrismaService);
    /**
     * Send push notification to user
     */
    sendToUser(userId: string, payload: NotificationPayload): Promise<void>;
    /**
     * Register push token for user
     */
    registerPushToken(userId: string, token: string): Promise<{
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
    /**
     * Update notification preferences
     */
    updatePreferences(userId: string, preferences: {
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
    /**
     * Notify user of new transaction
     */
    notifyTransaction(userId: string, transaction: {
        amount: number;
        currency: string;
        merchantName: string;
        cardId: string;
    }): Promise<void>;
    /**
     * Notify user of limit warning
     */
    notifyLimitWarning(userId: string, cardId: string, limitType: 'daily' | 'monthly', current: number, limit: number, percentage: number): Promise<void>;
    /**
     * Notify user of limit exceeded
     */
    notifyLimitExceeded(userId: string, cardId: string, limitType: 'daily' | 'monthly'): Promise<void>;
    /**
     * Notify user of card status change
     */
    notifyCardStatusChange(userId: string, cardId: string, status: 'FROZEN' | 'ACTIVE' | 'CLOSED'): Promise<void>;
    /**
     * Notify user of budget warning
     */
    notifyBudgetWarning(userId: string, category: string, spent: number, budget: number, percentage: number): Promise<void>;
    /**
     * Notify user of budget exceeded
     */
    notifyBudgetExceeded(userId: string, category: string, spent: number, budget: number): Promise<void>;
}
