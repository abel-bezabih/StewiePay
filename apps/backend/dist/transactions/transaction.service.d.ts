import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionStatus } from '@prisma/client';
import { CardsService } from '../cards/card.service';
import { MerchantLockService } from '../cards/merchant-lock.service';
import { TransactionCategoryService } from './transaction-category.service';
import { TimeWindowService } from '../cards/time-window.service';
import { NotificationService } from '../notifications/notification.service';
import { UsersService } from '../users/user.service';
export declare class TransactionsService {
    private prisma;
    private cardsService;
    private merchantLockService;
    private categoryService;
    private timeWindowService;
    private notificationService;
    private usersService;
    private readonly LIMITED_SPEND_PER_TXN;
    private readonly LIMITED_SPEND_DAILY;
    private readonly LIMITED_SPEND_MONTHLY;
    constructor(prisma: PrismaService, cardsService: CardsService, merchantLockService: MerchantLockService, categoryService: TransactionCategoryService, timeWindowService: TimeWindowService, notificationService: NotificationService, usersService: UsersService);
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
    private getEffectiveLimit;
    private assertRollingLimits;
    private sendTransactionNotification;
    private closeBurnerCardIfNeeded;
    list(userId: string, filters?: {
        cardId?: string;
        merchantName?: string;
        category?: string;
        startDate?: string;
        endDate?: string;
        minAmount?: number;
        maxAmount?: number;
        search?: string;
        status?: TransactionStatus;
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
