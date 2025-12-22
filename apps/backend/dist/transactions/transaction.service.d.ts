import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CardsService } from '../cards/card.service';
import { MerchantLockService } from '../cards/merchant-lock.service';
import { TransactionCategoryService } from './transaction-category.service';
import { TimeWindowService } from '../cards/time-window.service';
import { SubscriptionDetectionService } from '../subscriptions/subscription-detection.service';
import { NotificationService } from '../notifications/notification.service';
export declare class TransactionsService {
    private prisma;
    private cardsService;
    private merchantLockService;
    private categoryService;
    private timeWindowService;
    private subscriptionDetection;
    private notificationService;
    constructor(prisma: PrismaService, cardsService: CardsService, merchantLockService: MerchantLockService, categoryService: TransactionCategoryService, timeWindowService: TimeWindowService, subscriptionDetection: SubscriptionDetectionService, notificationService: NotificationService);
    simulate(userId: string, dto: CreateTransactionDto): Promise<{
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
    private assertPerTxnLimit;
    private assertRollingLimits;
    private sendTransactionNotification;
    list(userId: string, filters?: {
        cardId?: string;
        merchantName?: string;
        category?: string;
        startDate?: string;
        endDate?: string;
        minAmount?: number;
        maxAmount?: number;
        search?: string;
    }): Promise<{
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
}
