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
exports.SubscriptionDetectionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SubscriptionDetectionService = class SubscriptionDetectionService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Detects if a transaction is part of a recurring subscription pattern
     * and creates/updates subscription records accordingly
     */
    async detectAndUpdateSubscriptions(cardId, transactionId) {
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
    analyzePattern(transactions) {
        const merchant = transactions[0].merchantName;
        const currency = transactions[0].currency;
        // Calculate average amount (allowing for small variations)
        const amounts = transactions.map((t) => t.amount);
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const amountVariance = this.calculateVariance(amounts);
        // Calculate average interval between charges
        const intervals = [];
        for (let i = 1; i < transactions.length; i++) {
            const daysDiff = (transactions[i].timestamp.getTime() - transactions[i - 1].timestamp.getTime()) /
                (1000 * 60 * 60 * 24);
            intervals.push(daysDiff);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const intervalVariance = this.calculateVariance(intervals);
        // Calculate confidence score
        let confidence = 0.5; // Base confidence
        // More transactions = higher confidence
        if (transactions.length >= 3)
            confidence += 0.2;
        if (transactions.length >= 5)
            confidence += 0.1;
        // Consistent amounts = higher confidence (low variance)
        if (amountVariance < 0.1)
            confidence += 0.15; // Very consistent
        else if (amountVariance < 0.2)
            confidence += 0.1; // Mostly consistent
        // Regular intervals = higher confidence (low variance)
        if (intervalVariance < 2)
            confidence += 0.15; // Very regular (within 2 days)
        else if (intervalVariance < 7)
            confidence += 0.1; // Mostly regular (within a week)
        // Monthly patterns (28-31 days) = higher confidence
        if (avgInterval >= 28 && avgInterval <= 31)
            confidence += 0.1;
        // Weekly patterns (7 days) = higher confidence
        if (avgInterval >= 6 && avgInterval <= 8)
            confidence += 0.1;
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
    calculateVariance(values) {
        if (values.length === 0)
            return 0;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
        return variance / mean; // Return coefficient of variation (normalized)
    }
    /**
     * Creates or updates a subscription record
     */
    async createOrUpdateSubscription(cardId, pattern) {
        const existing = await this.prisma.subscription.findFirst({
            where: {
                cardId,
                merchant: pattern.merchant
            }
        });
        const nextExpectedCharge = this.calculateNextCharge(pattern.lastCharge, pattern.intervalDays);
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
        }
        else {
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
    calculateNextCharge(lastCharge, intervalDays) {
        const next = new Date(lastCharge);
        next.setDate(next.getDate() + intervalDays);
        return next;
    }
    /**
     * Gets all subscriptions for a card
     */
    async getSubscriptionsForCard(cardId) {
        return this.prisma.subscription.findMany({
            where: { cardId },
            orderBy: { nextExpectedCharge: 'asc' }
        });
    }
    /**
     * Gets all subscriptions for a user (across all cards)
     */
    async getSubscriptionsForUser(userId) {
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
    async createSubscription(cardId, merchant, amountHint, nextExpectedCharge) {
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
    async updateSubscription(subscriptionId, data) {
        return this.prisma.subscription.update({
            where: { id: subscriptionId },
            data
        });
    }
    /**
     * Get subscription by ID
     */
    async getSubscriptionById(subscriptionId) {
        return this.prisma.subscription.findUnique({
            where: { id: subscriptionId }
        });
    }
    /**
     * Delete subscription
     */
    async deleteSubscription(subscriptionId) {
        return this.prisma.subscription.delete({
            where: { id: subscriptionId }
        });
    }
};
exports.SubscriptionDetectionService = SubscriptionDetectionService;
exports.SubscriptionDetectionService = SubscriptionDetectionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubscriptionDetectionService);
//# sourceMappingURL=subscription-detection.service.js.map