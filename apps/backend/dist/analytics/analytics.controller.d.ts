import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    spendByMonth(req: any): Promise<{
        year: number;
        month: number;
        total: number;
        currency: string;
    }[]>;
    spendByCategory(req: any): Promise<{
        category: string;
        amount: number;
        count: number;
        percentage: number;
    }[]>;
    categoryTrends(req: any, months?: string): Promise<{
        category: string;
        data: {
            month: string;
            amount: number;
        }[];
    }[]>;
    topCategories(req: any, limit?: string): Promise<{
        category: string;
        amount: number;
        count: number;
        percentage: number;
    }[]>;
    insights(req: any): Promise<{
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
