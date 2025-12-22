export declare class UpdateMerchantLocksDto {
    blockedCategories?: string[];
    allowedCategories?: string[];
    blockedMerchants?: string[];
    allowedMerchants?: string[];
    merchantLockMode?: 'BLOCK' | 'ALLOW';
}
