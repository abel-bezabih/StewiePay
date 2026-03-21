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
}
