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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const card_service_1 = require("../cards/card.service");
let AnalyticsService = class AnalyticsService {
    constructor(prisma, cardsService) {
        this.prisma = prisma;
        this.cardsService = cardsService;
    }
    async spendByMonth(userId) {
        const cardIds = await this.cardsService.getAccessibleCardIds(userId);
        if (!cardIds.length)
            return [];
        const results = await this.prisma.$queryRawUnsafe(`
        SELECT EXTRACT(YEAR FROM "timestamp")::int AS year,
               EXTRACT(MONTH FROM "timestamp")::int AS month,
               SUM("amount")::bigint AS total,
               MIN("currency") AS currency
        FROM "Transaction"
        WHERE "cardId" = ANY($1)
          AND "status" IN ('AUTHORIZED','SETTLED')
        GROUP BY year, month
        ORDER BY year DESC, month DESC
      `, cardIds);
        return results;
    }
    async spendByCategory(userId) {
        const cardIds = await this.cardsService.getAccessibleCardIds(userId);
        if (!cardIds.length)
            return [];
        const results = await this.prisma.transaction.groupBy({
            by: ['category'],
            where: {
                cardId: { in: cardIds },
                status: { in: ['AUTHORIZED', 'SETTLED'] }
            },
            _sum: { amount: true },
            _count: { id: true },
            orderBy: { _sum: { amount: 'desc' } }
        });
        const total = results.reduce((sum, r) => sum + (r._sum.amount || 0), 0);
        return results.map((r) => ({
            category: r.category || 'Other',
            amount: r._sum.amount || 0,
            count: r._count.id || 0,
            percentage: total > 0 ? ((r._sum.amount || 0) / total) * 100 : 0
        }));
    }
    async categoryTrends(userId, months = 6) {
        const cardIds = await this.cardsService.getAccessibleCardIds(userId);
        if (!cardIds.length)
            return [];
        const results = await this.prisma.$queryRawUnsafe(`
        SELECT EXTRACT(YEAR FROM "timestamp")::int AS year,
               EXTRACT(MONTH FROM "timestamp")::int AS month,
               COALESCE("category", 'Other') AS category,
               SUM("amount")::bigint AS total
        FROM "Transaction"
        WHERE "cardId" = ANY($1)
          AND "status" IN ('AUTHORIZED','SETTLED')
          AND "timestamp" >= NOW() - INTERVAL '${months} months'
        GROUP BY year, month, category
        ORDER BY year DESC, month DESC, total DESC
      `, cardIds);
        // Group by category and month
        const trends = {};
        results.forEach((r) => {
            const key = `${r.year}-${String(r.month).padStart(2, '0')}`;
            if (!trends[r.category]) {
                trends[r.category] = [];
            }
            trends[r.category].push({ month: key, amount: Number(r.total) });
        });
        return Object.entries(trends).map(([category, data]) => ({
            category,
            data: data.sort((a, b) => a.month.localeCompare(b.month))
        }));
    }
    async topCategories(userId, limit = 5) {
        const cardIds = await this.cardsService.getAccessibleCardIds(userId);
        if (!cardIds.length)
            return [];
        const results = await this.prisma.transaction.groupBy({
            by: ['category'],
            where: {
                cardId: { in: cardIds },
                status: { in: ['AUTHORIZED', 'SETTLED'] }
            },
            _sum: { amount: true },
            _count: { id: true },
            orderBy: { _sum: { amount: 'desc' } },
            take: limit
        });
        const total = await this.prisma.transaction.aggregate({
            where: {
                cardId: { in: cardIds },
                status: { in: ['AUTHORIZED', 'SETTLED'] }
            },
            _sum: { amount: true }
        });
        const totalAmount = total._sum.amount || 0;
        return results.map((r) => ({
            category: r.category || 'Other',
            amount: r._sum.amount || 0,
            count: r._count.id || 0,
            percentage: totalAmount > 0 ? ((r._sum.amount || 0) / totalAmount) * 100 : 0
        }));
    }
    async spendingInsights(userId) {
        const cardIds = await this.cardsService.getAccessibleCardIds(userId);
        if (!cardIds.length) {
            return {
                totalSpend: 0,
                averageTransaction: 0,
                totalTransactions: 0,
                topCategory: null,
                monthlyAverage: 0
            };
        }
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const [totalStats, thisMonthStats, lastMonthStats, topCategory] = await Promise.all([
            this.prisma.transaction.aggregate({
                where: {
                    cardId: { in: cardIds },
                    status: { in: ['AUTHORIZED', 'SETTLED'] }
                },
                _sum: { amount: true },
                _count: { id: true },
                _avg: { amount: true }
            }),
            this.prisma.transaction.aggregate({
                where: {
                    cardId: { in: cardIds },
                    status: { in: ['AUTHORIZED', 'SETTLED'] },
                    timestamp: { gte: thisMonth }
                },
                _sum: { amount: true }
            }),
            this.prisma.transaction.aggregate({
                where: {
                    cardId: { in: cardIds },
                    status: { in: ['AUTHORIZED', 'SETTLED'] },
                    timestamp: { gte: lastMonth, lt: thisMonth }
                },
                _sum: { amount: true }
            }),
            this.prisma.transaction.groupBy({
                by: ['category'],
                where: {
                    cardId: { in: cardIds },
                    status: { in: ['AUTHORIZED', 'SETTLED'] }
                },
                _sum: { amount: true },
                orderBy: { _sum: { amount: 'desc' } },
                take: 1
            })
        ]);
        const monthlyChange = lastMonthStats._sum.amount && lastMonthStats._sum.amount > 0
            ? ((thisMonthStats._sum.amount || 0) - lastMonthStats._sum.amount) /
                lastMonthStats._sum.amount
            : 0;
        return {
            totalSpend: totalStats._sum.amount || 0,
            averageTransaction: totalStats._avg.amount || 0,
            totalTransactions: totalStats._count.id || 0,
            topCategory: topCategory[0]?.category || null,
            monthlySpend: thisMonthStats._sum.amount || 0,
            monthlyChange: monthlyChange * 100,
            monthlyAverage: totalStats._sum.amount
                ? (totalStats._sum.amount / Math.max(1, totalStats._count.id)) * 30
                : 0
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, card_service_1.CardsService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map