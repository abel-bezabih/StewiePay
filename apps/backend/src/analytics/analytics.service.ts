import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CardsService } from '../cards/card.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService, private cardsService: CardsService) {}

  async spendByMonth(userId: string) {
    const cardIds = await this.cardsService.getAccessibleCardIds(userId);
    if (!cardIds.length) return [];

    const results = await this.prisma.$queryRawUnsafe<
      { year: number; month: number; total: bigint | number; currency: string }[]
    >(
      `
        SELECT EXTRACT(YEAR FROM "timestamp")::int AS year,
               EXTRACT(MONTH FROM "timestamp")::int AS month,
               COALESCE(SUM("amount"), 0)::bigint AS total,
               MIN("currency") AS currency
        FROM "Transaction"
        WHERE "cardId" = ANY($1)
          AND "status" IN ('AUTHORIZED','SETTLED')
        GROUP BY 1, 2
        ORDER BY 1 DESC, 2 DESC
      `,
      cardIds
    );
    return results.map((row) => ({
      year: row.year,
      month: row.month,
      total: typeof row.total === 'bigint' ? Number(row.total) : row.total,
      currency: row.currency
    }));
  }

  async spendByCategory(userId: string) {
    const cardIds = await this.cardsService.getAccessibleCardIds(userId);
    if (!cardIds.length) return [];

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
}






