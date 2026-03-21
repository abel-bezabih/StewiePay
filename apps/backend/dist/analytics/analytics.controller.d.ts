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
}
