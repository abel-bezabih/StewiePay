import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CardStatus, CardType, TransactionStatus } from '@prisma/client';
import { CardsService } from '../cards/card.service';
import { MerchantLockService } from '../cards/merchant-lock.service';
import { TransactionCategoryService } from './transaction-category.service';
import { TimeWindowService } from '../cards/time-window.service';
import { NotificationService } from '../notifications/notification.service';
import { PaymentAccessTier, UsersService } from '../users/user.service';

@Injectable()
export class TransactionsService {
  private readonly LIMITED_SPEND_PER_TXN = Number(process.env.KYC_LIMITED_SPEND_PER_TXN ?? 3_000);
  private readonly LIMITED_SPEND_DAILY = Number(process.env.KYC_LIMITED_SPEND_DAILY ?? 10_000);
  private readonly LIMITED_SPEND_MONTHLY = Number(process.env.KYC_LIMITED_SPEND_MONTHLY ?? 50_000);

  constructor(
    private prisma: PrismaService,
    private cardsService: CardsService,
    private merchantLockService: MerchantLockService,
    private categoryService: TransactionCategoryService,
    private timeWindowService: TimeWindowService,
    private notificationService: NotificationService,
    private usersService: UsersService
  ) {}

  async simulate(userId: string, dto: CreateTransactionDto) {
    const paymentAccess = await this.usersService.assertPaymentKycEligible(userId, 'simulate a transaction', {
      allowSubmittedWithLimits: true
    });
    // Ensure user can access the card
    const card = await this.cardsService.getAccessibleCard(dto.cardId, userId);

    // Check merchant locks FIRST (before spending limits)
    await this.merchantLockService.validateTransaction(
      card,
      dto.merchantName,
      dto.mcc,
      dto.category
    );

    // Check time window restrictions
    this.timeWindowService.assertTransactionAllowed(card);

    // Check spending limits
    const effectivePerTxnLimit = this.getEffectiveLimit(card.limitPerTxn, this.LIMITED_SPEND_PER_TXN, paymentAccess.tier);
    const effectiveDailyLimit = this.getEffectiveLimit(card.limitDaily, this.LIMITED_SPEND_DAILY, paymentAccess.tier);
    const effectiveMonthlyLimit = this.getEffectiveLimit(card.limitMonthly, this.LIMITED_SPEND_MONTHLY, paymentAccess.tier);
    this.assertPerTxnLimit(effectivePerTxnLimit, dto.amount);
    await this.assertRollingLimits(card.id, effectiveDailyLimit, effectiveMonthlyLimit, dto.amount);

    // Auto-categorize transaction if category not provided
    const category = dto.category || this.categoryService.categorize(dto.merchantName, dto.mcc);

    const status = dto.status ?? TransactionStatus.AUTHORIZED;
    const transaction = await this.prisma.transaction.create({
      data: {
        cardId: dto.cardId,
        amount: dto.amount,
        currency: dto.currency,
        merchantName: dto.merchantName,
        mcc: dto.mcc,
        category,
        status,
        timestamp: new Date()
      }
    });

    if (status === TransactionStatus.SETTLED) {
      // Send transaction notification (async, don't block)
      this.sendTransactionNotification(card, transaction).catch((err) => {
        console.error('Notification failed:', err);
      });

      // Auto-close burner cards after first settled transaction
      this.closeBurnerCardIfNeeded(card).catch((err) => {
        console.error('Failed to auto-close burner card:', err);
      });
    }

    return transaction;
  }

  private assertPerTxnLimit(limit: number | null | undefined, amount: number) {
    if (limit && amount > limit) {
      throw new BadRequestException('Per-transaction limit exceeded');
    }
  }

  private getEffectiveLimit(
    cardLimit: number | null | undefined,
    limitedTierCap: number,
    tier: PaymentAccessTier
  ): number | undefined {
    if (tier !== 'LIMITED') {
      return cardLimit ?? undefined;
    }
    if (cardLimit === null || cardLimit === undefined) {
      return limitedTierCap;
    }
    return Math.min(cardLimit, limitedTierCap);
  }

  private async assertRollingLimits(
    cardId: string,
    daily: number | null | undefined,
    monthly: number | null | undefined,
    amount: number
  ) {
    const statuses = [TransactionStatus.AUTHORIZED, TransactionStatus.SETTLED];

    if (daily) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const daySum =
        (await this.prisma.transaction.aggregate({
          where: { cardId, status: { in: statuses }, timestamp: { gte: start } },
          _sum: { amount: true }
        }))._sum.amount ?? 0;
      const newTotal = daySum + amount;
      const percentage = (newTotal / daily) * 100;

      // Send warning if approaching limit (80% threshold)
      if (percentage >= 80 && percentage < 100) {
        const card = await this.prisma.card.findUnique({ where: { id: cardId } });
        if (card) {
          const ownerUserId = card.ownerUserId;
          if (ownerUserId) {
            this.notificationService
              .notifyLimitWarning(ownerUserId, cardId, 'daily', newTotal, daily, percentage)
              .catch((err) => console.error('Limit warning notification failed:', err));
          }
        }
      }

      if (newTotal > daily) {
        throw new BadRequestException('Daily limit exceeded');
      }
    }

    if (monthly) {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const monthSum =
        (await this.prisma.transaction.aggregate({
          where: { cardId, status: { in: statuses }, timestamp: { gte: start } },
          _sum: { amount: true }
        }))._sum.amount ?? 0;
      const newTotal = monthSum + amount;
      const percentage = (newTotal / monthly) * 100;

      // Send warning if approaching limit (80% threshold)
      if (percentage >= 80 && percentage < 100) {
        const card = await this.prisma.card.findUnique({ where: { id: cardId } });
        if (card) {
          const ownerUserId = card.ownerUserId;
          if (ownerUserId) {
            this.notificationService
              .notifyLimitWarning(ownerUserId, cardId, 'monthly', newTotal, monthly, percentage)
              .catch((err) => console.error('Limit warning notification failed:', err));
          }
        }
      }

      if (newTotal > monthly) {
        throw new BadRequestException('Monthly limit exceeded');
      }
    }
  }

  private async sendTransactionNotification(card: any, transaction: any) {
    // Get card owner (user or org owner)
    const ownerUserId = card.ownerUserId;
    if (ownerUserId) {
      await this.notificationService.notifyTransaction(ownerUserId, {
        amount: transaction.amount,
        currency: transaction.currency,
        merchantName: transaction.merchantName,
        cardId: transaction.cardId
      });
    }
  }

  private async closeBurnerCardIfNeeded(card: { id: string; type: CardType; status: CardStatus; ownerUserId?: string | null }) {
    if (card.type !== CardType.BURNER || card.status !== CardStatus.ACTIVE) {
      return;
    }

    await this.prisma.card.update({
      where: { id: card.id },
      data: { status: CardStatus.CLOSED }
    });

    const ownerUserId = card.ownerUserId;
    if (ownerUserId) {
      await this.notificationService.notifyCardStatusChange(ownerUserId, card.id, 'CLOSED');
    }
  }

  async list(
    userId: string,
    filters?: {
      cardId?: string;
      merchantName?: string;
      category?: string;
      startDate?: string;
      endDate?: string;
      minAmount?: number;
      maxAmount?: number;
      search?: string;
      status?: TransactionStatus;
    }
  ) {
    const accessibleIds = await this.cardsService.getAccessibleCardIds(userId);
    if (!accessibleIds.length) return [];

    // Build where clause
    const where: any = {
      cardId: filters?.cardId
        ? filters.cardId
        : { in: accessibleIds }
    };

    // Verify card access if cardId is specified
    if (filters?.cardId && !accessibleIds.includes(filters.cardId)) {
      throw new UnauthorizedException('No access to this card');
    }

    // Apply filters
    if (filters?.merchantName) {
      where.merchantName = {
        contains: filters.merchantName,
        mode: 'insensitive'
      };
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.timestamp.lte = new Date(filters.endDate);
      }
    }

    if (filters?.minAmount !== undefined || filters?.maxAmount !== undefined) {
      where.amount = {};
      if (filters.minAmount !== undefined) {
        where.amount.gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        where.amount.lte = filters.maxAmount;
      }
    }

    // Search in merchant name or transaction ID
    if (filters?.search) {
      where.OR = [
        {
          merchantName: {
            contains: filters.search,
            mode: 'insensitive'
          }
        },
        {
          id: {
            contains: filters.search,
            mode: 'insensitive'
          }
        }
      ];
    }

    return this.prisma.transaction.findMany({
      where,
      orderBy: { timestamp: 'desc' }
    });
  }
}

