import { PrismaService } from '../prisma/prisma.service';
export declare class SubscriptionDetectionService {
    private prisma;
    constructor(prisma: PrismaService);
    /**
     * Detects if a transaction is part of a recurring subscription pattern
     * and creates/updates subscription records accordingly
     */
    detectAndUpdateSubscriptions(cardId: string, transactionId: string): Promise<void>;
    /**
     * Analyzes transaction history to detect recurring patterns
     */
    private analyzePattern;
    /**
     * Calculates variance of a number array
     */
    private calculateVariance;
    /**
     * Creates or updates a subscription record
     */
    private createOrUpdateSubscription;
    /**
     * Calculates next expected charge date
     */
    private calculateNextCharge;
    /**
     * Gets all subscriptions for a card
     */
    getSubscriptionsForCard(cardId: string): Promise<{
        id: string;
        currency: string;
        merchant: string;
        cardId: string;
        amountHint: number | null;
        nextExpectedCharge: Date | null;
        lastChargeAt: Date | null;
    }[]>;
    /**
     * Gets all subscriptions for a user (across all cards)
     */
    getSubscriptionsForUser(userId: string): Promise<({
        card: {
            id: string;
            issuerCardId: string;
            status: import(".prisma/client").$Enums.CardStatus;
        };
    } & {
        id: string;
        currency: string;
        merchant: string;
        cardId: string;
        amountHint: number | null;
        nextExpectedCharge: Date | null;
        lastChargeAt: Date | null;
    })[]>;
    /**
     * Manually create a subscription (user-initiated)
     */
    createSubscription(cardId: string, merchant: string, amountHint?: number, nextExpectedCharge?: Date): Promise<{
        id: string;
        currency: string;
        merchant: string;
        cardId: string;
        amountHint: number | null;
        nextExpectedCharge: Date | null;
        lastChargeAt: Date | null;
    }>;
    /**
     * Update subscription
     */
    updateSubscription(subscriptionId: string, data: {
        merchant?: string;
        amountHint?: number;
        nextExpectedCharge?: Date;
        lastChargeAt?: Date;
    }): Promise<{
        id: string;
        currency: string;
        merchant: string;
        cardId: string;
        amountHint: number | null;
        nextExpectedCharge: Date | null;
        lastChargeAt: Date | null;
    }>;
    /**
     * Get subscription by ID
     */
    getSubscriptionById(subscriptionId: string): Promise<{
        id: string;
        currency: string;
        merchant: string;
        cardId: string;
        amountHint: number | null;
        nextExpectedCharge: Date | null;
        lastChargeAt: Date | null;
    } | null>;
    /**
     * Delete subscription
     */
    deleteSubscription(subscriptionId: string): Promise<{
        id: string;
        currency: string;
        merchant: string;
        cardId: string;
        amountHint: number | null;
        nextExpectedCharge: Date | null;
        lastChargeAt: Date | null;
    }>;
}
