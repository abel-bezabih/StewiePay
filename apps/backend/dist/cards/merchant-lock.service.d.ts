import { Card } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export interface MerchantLockConfig {
    blockedCategories?: string[];
    allowedCategories?: string[];
    blockedMerchants?: string[];
    allowedMerchants?: string[];
    merchantLockMode?: 'BLOCK' | 'ALLOW';
}
export declare class MerchantLockService {
    private prisma;
    constructor(prisma: PrismaService);
    /**
     * Check if a transaction is allowed based on merchant locks
     */
    validateTransaction(card: Card, merchantName: string, mcc?: string | null, category?: string | null): Promise<void>;
    /**
     * Validate card type-specific restrictions
     */
    private validateCardTypeRestrictions;
    /**
     * Normalize merchant name for comparison
     */
    private normalizeMerchantName;
    /**
     * Update merchant locks for a card
     */
    updateMerchantLocks(cardId: string, config: MerchantLockConfig): Promise<Card>;
    /**
     * Get common MCC categories for reference
     */
    getCommonMccCategories(): Record<string, string>;
}
