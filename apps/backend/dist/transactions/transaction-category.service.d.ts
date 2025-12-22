export type TransactionCategory = 'Food & Drink' | 'Shopping' | 'Travel' | 'Entertainment' | 'Bills & Utilities' | 'Transportation' | 'Healthcare' | 'Education' | 'Gambling' | 'Other';
export declare class TransactionCategoryService {
    private readonly categoryMappings;
    /**
     * Categorize a transaction based on MCC code and merchant name
     */
    categorize(merchantName: string, mcc?: string | null): TransactionCategory;
    /**
     * Get all available categories
     */
    getCategories(): TransactionCategory[];
    /**
     * Get category icon (for frontend)
     */
    getCategoryIcon(category: TransactionCategory): string;
    /**
     * Get category color (for frontend)
     */
    getCategoryColor(category: TransactionCategory): string;
}
