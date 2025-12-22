"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notification_service_1 = require("../notifications/notification.service");
let BudgetService = class BudgetService {
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
    }
    async create(userId, dto) {
        // Check if budget already exists for this category and period
        const existing = await this.prisma.budget.findUnique({
            where: {
                userId_category_period: {
                    userId,
                    category: dto.category,
                    period: dto.period || 'monthly'
                }
            }
        });
        if (existing) {
            throw new common_1.BadRequestException(`Budget already exists for ${dto.category} (${dto.period || 'monthly'})`);
        }
        return this.prisma.budget.create({
            data: {
                userId,
                category: dto.category,
                amount: dto.amount,
                period: dto.period || 'monthly',
                currency: dto.currency || 'ETB'
            }
        });
    }
    async list(userId) {
        return this.prisma.budget.findMany({
            where: { userId },
            orderBy: { category: 'asc' }
        });
    }
    async getById(userId, budgetId) {
        const budget = await this.prisma.budget.findUnique({
            where: { id: budgetId }
        });
        if (!budget || budget.userId !== userId) {
            throw new common_1.NotFoundException('Budget not found');
        }
        return budget;
    }
    async update(userId, budgetId, dto) {
        await this.getById(userId, budgetId);
        return this.prisma.budget.update({
            where: { id: budgetId },
            data: {
                amount: dto.amount,
                period: dto.period,
                currency: dto.currency
            }
        });
    }
    async delete(userId, budgetId) {
        await this.getById(userId, budgetId);
        return this.prisma.budget.delete({
            where: { id: budgetId }
        });
    }
    /**
     * Get budget progress for a user
     */
    async getBudgetProgress(userId, budgetId) {
        const budgets = budgetId
            ? [await this.getById(userId, budgetId)]
            : await this.list(userId);
        const results = [];
        for (const budget of budgets) {
            const { periodStart, periodEnd } = this.getPeriodDates(budget.period);
            // Get all cards for user
            const cards = await this.prisma.card.findMany({
                where: {
                    OR: [
                        { ownerUserId: userId },
                        {
                            ownerOrgId: {
                                in: await this.prisma.organization
                                    .findMany({
                                    where: { ownerId: userId },
                                    select: { id: true }
                                })
                                    .then(orgs => orgs.map(o => o.id))
                            }
                        }
                    ]
                },
                select: { id: true }
            });
            const cardIds = cards.map(c => c.id);
            // Get transactions for this period and category
            const transactions = await this.prisma.transaction.aggregate({
                where: {
                    cardId: { in: cardIds },
                    category: budget.category,
                    status: { in: ['AUTHORIZED', 'SETTLED'] },
                    timestamp: {
                        gte: periodStart,
                        lte: periodEnd
                    }
                },
                _sum: { amount: true }
            });
            const spent = transactions._sum.amount || 0;
            const remaining = Math.max(0, budget.amount - spent);
            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            results.push({
                budget,
                spent,
                remaining,
                percentage,
                periodStart,
                periodEnd
            });
            // Send notification if budget is exceeded or approaching limit
            if (percentage >= 100) {
                // Budget exceeded
                this.notificationService
                    .notifyBudgetExceeded(userId, budget.category, spent, budget.amount)
                    .catch(err => console.error('Budget notification failed:', err));
            }
            else if (percentage >= 80 && percentage < 100) {
                // Approaching limit
                this.notificationService
                    .notifyBudgetWarning(userId, budget.category, spent, budget.amount, percentage)
                    .catch(err => console.error('Budget notification failed:', err));
            }
        }
        return results;
    }
    /**
     * Get period start and end dates based on period type
     */
    getPeriodDates(period) {
        const now = new Date();
        let periodStart;
        let periodEnd;
        if (period === 'weekly') {
            // Start of current week (Monday)
            const dayOfWeek = now.getDay();
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Monday start
            periodStart = new Date(now);
            periodStart.setDate(now.getDate() + diff);
            periodStart.setHours(0, 0, 0, 0);
            periodEnd = new Date(periodStart);
            periodEnd.setDate(periodStart.getDate() + 6);
            periodEnd.setHours(23, 59, 59, 999);
        }
        else {
            // Monthly (default)
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
            periodStart.setHours(0, 0, 0, 0);
            periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            periodEnd.setHours(23, 59, 59, 999);
        }
        return { periodStart, periodEnd };
    }
};
exports.BudgetService = BudgetService;
exports.BudgetService = BudgetService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService])
], BudgetService);
//# sourceMappingURL=budget.service.js.map