import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { NotificationService } from '../notifications/notification.service';
export interface BudgetProgress {
    budget: any;
    spent: number;
    remaining: number;
    percentage: number;
    periodStart: Date;
    periodEnd: Date;
}
export declare class BudgetService {
    private prisma;
    private notificationService;
    constructor(prisma: PrismaService, notificationService: NotificationService);
    create(userId: string, dto: CreateBudgetDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        currency: string;
        amount: number;
        category: string;
        period: string;
    }>;
    list(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        currency: string;
        amount: number;
        category: string;
        period: string;
    }[]>;
    getById(userId: string, budgetId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        currency: string;
        amount: number;
        category: string;
        period: string;
    }>;
    update(userId: string, budgetId: string, dto: UpdateBudgetDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        currency: string;
        amount: number;
        category: string;
        period: string;
    }>;
    delete(userId: string, budgetId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        currency: string;
        amount: number;
        category: string;
        period: string;
    }>;
    /**
     * Get budget progress for a user
     */
    getBudgetProgress(userId: string, budgetId?: string): Promise<BudgetProgress[]>;
    /**
     * Get period start and end dates based on period type
     */
    private getPeriodDates;
}
