import { TransactionStatus } from '@prisma/client';
export declare class ListTransactionsDto {
    cardId?: string;
    merchantName?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
    status?: TransactionStatus;
}
