import { PrismaService } from '../prisma/prisma.service';
import { CardsService } from '../cards/card.service';
export declare class AnalyticsService {
    private prisma;
    private cardsService;
    constructor(prisma: PrismaService, cardsService: CardsService);
    spendByMonth(userId: string): Promise<{
        year: number;
        month: number;
        total: number;
        currency: string;
    }[]>;
    spendByCategory(userId: string): Promise<{
        category: string;
        amount: number;
        count: number;
        percentage: number;
    }[]>;
    categoryTrends(userId: string, months?: number): Promise<{
        category: string;
        data: {
            month: string;
            amount: number;
        }[];
    }[]>;
    topCategories(userId: string, limit?: number): Promise<{
        category: string;
        amount: number;
        count: number;
        percentage: number;
    }[]>;
    spendingInsights(userId: string): Promise<{
        totalSpend: number;
        averageTransaction: number;
        totalTransactions: number;
        topCategory: null;
        monthlyAverage: number;
        monthlySpend?: undefined;
        monthlyChange?: undefined;
    } | {
        totalSpend: number;
        averageTransaction: number;
        totalTransactions: number;
        topCategory: string | null;
        monthlySpend: number;
        monthlyChange: number;
        monthlyAverage: number;
    }>;
}
