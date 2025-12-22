import { TransactionsService } from './transaction.service';
import { TransactionCategoryService } from './transaction-category.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsDto } from './dto/list-transactions.dto';
export declare class TransactionsController {
    private readonly txService;
    private readonly categoryService;
    constructor(txService: TransactionsService, categoryService: TransactionCategoryService);
    simulate(req: any, dto: CreateTransactionDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.TransactionStatus;
        currency: string;
        amount: number;
        cardId: string;
        category: string | null;
        merchantName: string;
        mcc: string | null;
        timestamp: Date;
    }>;
    list(req: any, query: ListTransactionsDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.TransactionStatus;
        currency: string;
        amount: number;
        cardId: string;
        category: string | null;
        merchantName: string;
        mcc: string | null;
        timestamp: Date;
    }[]>;
    getCategories(): {
        name: import("./transaction-category.service").TransactionCategory;
        icon: string;
        color: string;
    }[];
}
