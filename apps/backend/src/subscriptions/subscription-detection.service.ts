import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface RecurringPattern {
  merchant: string;
  amount: number;
  currency: string;
  intervalDays: number; // Average days between charges
  confidence: number; // 0-1, how confident we are this is a subscription
  lastCharge: Date;
  chargeCount: number;
}

@Injectable()
export class SubscriptionDetectionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Detects if a transaction is part of a recurring subscription pattern
   * and creates/updates subscription records accordingly
   */
  async detectAndUpdateSubscriptions(cardId: string, transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!transaction || transaction.status !== 'SETTLED') {
      return; // Only process settled transactions
    }

    // Get all settled transactions for this card, ordered by date
    const allTransactions = await this.prisma.transaction.findMany({
      where: {
        cardId,
        status: 'SETTLED',
        merchantName: transaction.merchantName
      },
      orderBy: { timestamp: 'asc' }
    });

    if (allTransactions.length < 2) {
      return; // Need at least 2 transactions to detect a pattern
    }

    // Analyze pattern
    const pattern = this.analyzePattern(allTransactions);

    if (pattern.confidence >= 0.7) {
      // High confidence - create or update subscription
      await this.createOrUpdateSubscription(cardId, pattern);
    }
  }

  /**
   * Analyzes transaction history to detect recurring patterns
   */
  private analyzePattern(transactions: any[]): RecurringPattern {
    const merchant = transactions[0].merchantName;
    const currency = transactions[0].currency;

    // Calculate average amount (allowing for small variations)
    const amounts = transactions.map((t) => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const amountVariance = this.calculateVariance(amounts);

    // Calculate average interval between charges
    const intervals: number[] = [];
    for (let i = 1; i < transactions.length; i++) {
      const daysDiff =
        (transactions[i].timestamp.getTime() - transactions[i - 1].timestamp.getTime()) /
        (1000 * 60 * 60 * 24);
      intervals.push(daysDiff);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const intervalVariance = this.calculateVariance(intervals);

    // Calculate confidence score
    let confidence = 0.5; // Base confidence

    // More transactions = higher confidence
    if (transactions.length >= 3) confidence += 0.2;
    if (transactions.length >= 5) confidence += 0.1;

    // Consistent amounts = higher confidence (low variance)
    if (amountVariance < 0.1) confidence += 0.15; // Very consistent
    else if (amountVariance < 0.2) confidence += 0.1; // Mostly consistent

    // Regular intervals = higher confidence (low variance)
    if (intervalVariance < 2) confidence += 0.15; // Very regular (within 2 days)
    else if (intervalVariance < 7) confidence += 0.1; // Mostly regular (within a week)

    // Monthly patterns (28-31 days) = higher confidence
    if (avgInterval >= 28 && avgInterval <= 31) confidence += 0.1;

    // Weekly patterns (7 days) = higher confidence
    if (avgInterval >= 6 && avgInterval <= 8) confidence += 0.1;

    confidence = Math.min(confidence, 1.0); // Cap at 1.0

    return {
      merchant,
      amount: Math.round(avgAmount),
      currency,
      intervalDays: Math.round(avgInterval),
      confidence,
      lastCharge: transactions[transactions.length - 1].timestamp,
      chargeCount: transactions.length
    };
  }

  /**
   * Calculates variance of a number array
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return variance / mean; // Return coefficient of variation (normalized)
  }

  /**
   * Creates or updates a subscription record
   */
  private async createOrUpdateSubscription(cardId: string, pattern: RecurringPattern) {
    const existing = await this.prisma.subscription.findFirst({
      where: {
        cardId,
        merchant: pattern.merchant
      }
    });

    const nextExpectedCharge = this.calculateNextCharge(
      pattern.lastCharge,
      pattern.intervalDays
    );

    if (existing) {
      // Update existing subscription
      await this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          amountHint: pattern.amount,
          lastChargeAt: pattern.lastCharge,
          nextExpectedCharge,
          currency: pattern.currency
        }
      });
    } else {
      // Create new subscription
      await this.prisma.subscription.create({
        data: {
          cardId,
          merchant: pattern.merchant,
          amountHint: pattern.amount,
          currency: pattern.currency,
          lastChargeAt: pattern.lastCharge,
          nextExpectedCharge
        }
      });
    }
  }

  /**
   * Calculates next expected charge date
   */
  private calculateNextCharge(lastCharge: Date, intervalDays: number): Date {
    const next = new Date(lastCharge);
    next.setDate(next.getDate() + intervalDays);
    return next;
  }

  /**
   * Gets all subscriptions for a card
   */
  async getSubscriptionsForCard(cardId: string) {
    return this.prisma.subscription.findMany({
      where: { cardId },
      orderBy: { nextExpectedCharge: 'asc' }
    });
  }

  /**
   * Gets all subscriptions for a user (across all cards)
   */
  async getSubscriptionsForUser(userId: string) {
    // Get all card IDs for user
    const cards = await this.prisma.card.findMany({
      where: {
        OR: [
          { ownerUserId: userId },
          {
            ownerOrg: {
              OR: [
                { ownerId: userId },
                { members: { some: { userId } } }
              ]
            }
          }
        ]
      },
      select: { id: true }
    });

    const cardIds = cards.map((c) => c.id);

    return this.prisma.subscription.findMany({
      where: { cardId: { in: cardIds } },
      include: {
        card: {
          select: {
            id: true,
            issuerCardId: true,
            status: true
          }
        }
      },
      orderBy: { nextExpectedCharge: 'asc' }
    });
  }

  /**
   * Manually create a subscription (user-initiated)
   */
  async createSubscription(
    cardId: string,
    merchant: string,
    amountHint?: number,
    nextExpectedCharge?: Date
  ) {
    return this.prisma.subscription.create({
      data: {
        cardId,
        merchant,
        amountHint,
        nextExpectedCharge,
        currency: 'ETB'
      }
    });
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    subscriptionId: string,
    data: {
      merchant?: string;
      amountHint?: number;
      nextExpectedCharge?: Date;
      lastChargeAt?: Date;
    }
  ) {
    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data
    });
  }

  /**
   * Get subscription by ID
   */
  async getSubscriptionById(subscriptionId: string) {
    return this.prisma.subscription.findUnique({
      where: { id: subscriptionId }
    });
  }

  /**
   * Delete subscription
   */
  async deleteSubscription(subscriptionId: string) {
    return this.prisma.subscription.delete({
      where: { id: subscriptionId }
    });
  }
}

