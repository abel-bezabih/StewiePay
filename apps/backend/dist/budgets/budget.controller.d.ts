import { BudgetService, BudgetProgress } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
export declare class BudgetController {
    private readonly budgetService;
    constructor(budgetService: BudgetService);
    create(req: any, dto: CreateBudgetDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        currency: string;
        amount: number;
        category: string;
        period: string;
    }>;
    list(req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        currency: string;
        amount: number;
        category: string;
        period: string;
    }[]>;
    getProgress(req: any): Promise<BudgetProgress[]>;
    getById(req: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        currency: string;
        amount: number;
        category: string;
        period: string;
    }>;
    getProgressById(req: any, id: string): Promise<BudgetProgress[]>;
    update(req: any, id: string, dto: UpdateBudgetDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        currency: string;
        amount: number;
        category: string;
        period: string;
    }>;
    delete(req: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        currency: string;
        amount: number;
        category: string;
        period: string;
    }>;
}
