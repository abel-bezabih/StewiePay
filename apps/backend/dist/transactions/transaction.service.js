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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const card_service_1 = require("../cards/card.service");
const merchant_lock_service_1 = require("../cards/merchant-lock.service");
const transaction_category_service_1 = require("./transaction-category.service");
const time_window_service_1 = require("../cards/time-window.service");
const notification_service_1 = require("../notifications/notification.service");
const user_service_1 = require("../users/user.service");
let TransactionsService = class TransactionsService {
    constructor(prisma, cardsService, merchantLockService, categoryService, timeWindowService, notificationService, usersService) {
        this.prisma = prisma;
        this.cardsService = cardsService;
        this.merchantLockService = merchantLockService;
        this.categoryService = categoryService;
        this.timeWindowService = timeWindowService;
        this.notificationService = notificationService;
        this.usersService = usersService;
        this.LIMITED_SPEND_PER_TXN = Number(process.env.KYC_LIMITED_SPEND_PER_TXN ?? 3000);
        this.LIMITED_SPEND_DAILY = Number(process.env.KYC_LIMITED_SPEND_DAILY ?? 10000);
        this.LIMITED_SPEND_MONTHLY = Number(process.env.KYC_LIMITED_SPEND_MONTHLY ?? 50000);
    }
    async simulate(userId, dto) {
        const paymentAccess = await this.usersService.assertPaymentKycEligible(userId, 'simulate a transaction', {
            allowSubmittedWithLimits: true
        });
        // Ensure user can access the card
        const card = await this.cardsService.getAccessibleCard(dto.cardId, userId);
        // Check merchant locks FIRST (before spending limits)
        await this.merchantLockService.validateTransaction(card, dto.merchantName, dto.mcc, dto.category);
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
        const status = dto.status ?? client_1.TransactionStatus.AUTHORIZED;
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
        if (status === client_1.TransactionStatus.SETTLED) {
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
    assertPerTxnLimit(limit, amount) {
        if (limit && amount > limit) {
            throw new common_1.BadRequestException('Per-transaction limit exceeded');
        }
    }
    getEffectiveLimit(cardLimit, limitedTierCap, tier) {
        if (tier !== 'LIMITED') {
            return cardLimit ?? undefined;
        }
        if (cardLimit === null || cardLimit === undefined) {
            return limitedTierCap;
        }
        return Math.min(cardLimit, limitedTierCap);
    }
    async assertRollingLimits(cardId, daily, monthly, amount) {
        const statuses = [client_1.TransactionStatus.AUTHORIZED, client_1.TransactionStatus.SETTLED];
        if (daily) {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const daySum = (await this.prisma.transaction.aggregate({
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
                throw new common_1.BadRequestException('Daily limit exceeded');
            }
        }
        if (monthly) {
            const start = new Date();
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            const monthSum = (await this.prisma.transaction.aggregate({
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
                throw new common_1.BadRequestException('Monthly limit exceeded');
            }
        }
    }
    async sendTransactionNotification(card, transaction) {
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
    async closeBurnerCardIfNeeded(card) {
        if (card.type !== client_1.CardType.BURNER || card.status !== client_1.CardStatus.ACTIVE) {
            return;
        }
        await this.prisma.card.update({
            where: { id: card.id },
            data: { status: client_1.CardStatus.CLOSED }
        });
        const ownerUserId = card.ownerUserId;
        if (ownerUserId) {
            await this.notificationService.notifyCardStatusChange(ownerUserId, card.id, 'CLOSED');
        }
    }
    async list(userId, filters) {
        const accessibleIds = await this.cardsService.getAccessibleCardIds(userId);
        if (!accessibleIds.length)
            return [];
        // Build where clause
        const where = {
            cardId: filters?.cardId
                ? filters.cardId
                : { in: accessibleIds }
        };
        // Verify card access if cardId is specified
        if (filters?.cardId && !accessibleIds.includes(filters.cardId)) {
            throw new common_1.UnauthorizedException('No access to this card');
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
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        card_service_1.CardsService,
        merchant_lock_service_1.MerchantLockService,
        transaction_category_service_1.TransactionCategoryService,
        time_window_service_1.TimeWindowService,
        notification_service_1.NotificationService,
        user_service_1.UsersService])
], TransactionsService);
//# sourceMappingURL=transaction.service.js.map