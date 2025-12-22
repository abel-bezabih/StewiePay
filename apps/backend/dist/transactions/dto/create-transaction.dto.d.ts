import { TransactionStatus } from '@prisma/client';
export declare class CreateTransactionDto {
    cardId: string;
    amount: number;
    currency: string;
    merchantName: string;
    mcc?: string;
    category?: string;
    status?: TransactionStatus;
}
