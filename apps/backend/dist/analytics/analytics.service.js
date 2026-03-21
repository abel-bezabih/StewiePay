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
               COALESCE(SUM("amount"), 0)::bigint AS total,
               MIN("currency") AS currency
        FROM "Transaction"
        WHERE "cardId" = ANY($1)
          AND "status" IN ('AUTHORIZED','SETTLED')
        GROUP BY 1, 2
        ORDER BY 1 DESC, 2 DESC
      `, cardIds);
        return results.map((row) => ({
            year: row.year,
            month: row.month,
            total: typeof row.total === 'bigint' ? Number(row.total) : row.total,
            currency: row.currency
        }));
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
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, card_service_1.CardsService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map