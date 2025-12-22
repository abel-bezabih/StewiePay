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
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let NotificationService = class NotificationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Send push notification to user
     */
    async sendToUser(userId, payload) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { pushToken: true, notificationPreferences: true }
        });
        if (!user || !user.pushToken) {
            return; // User hasn't registered for push notifications
        }
        // Check notification preferences
        const prefs = user.notificationPreferences || {};
        // For now, we'll send all notifications. In production, check prefs here.
        // In production, use a push notification service (FCM, APNs, Expo Push Notifications)
        // For now, we'll just log it
        console.log(`[Notification] Sending to user ${userId}:`, payload);
        // TODO: Integrate with Expo Push Notifications API or FCM/APNs
        // await this.sendPushNotification(user.pushToken, payload);
    }
    /**
     * Register push token for user
     */
    async registerPushToken(userId, token) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { pushToken: token }
        });
    }
    /**
     * Update notification preferences
     */
    async updatePreferences(userId, preferences) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { notificationPreferences: true }
        });
        const currentPrefs = user?.notificationPreferences || {};
        const newPrefs = { ...currentPrefs, ...preferences };
        return this.prisma.user.update({
            where: { id: userId },
            data: { notificationPreferences: newPrefs }
        });
    }
    /**
     * Notify user of new transaction
     */
    async notifyTransaction(userId, transaction) {
        await this.sendToUser(userId, {
            title: 'New Transaction',
            body: `${transaction.merchantName} - ${transaction.currency} ${transaction.amount.toLocaleString()}`,
            data: {
                type: 'transaction',
                transactionId: transaction.cardId,
                amount: transaction.amount,
                merchant: transaction.merchantName
            }
        });
    }
    /**
     * Notify user of limit warning
     */
    async notifyLimitWarning(userId, cardId, limitType, current, limit, percentage) {
        await this.sendToUser(userId, {
            title: 'Spending Limit Warning',
            body: `You've used ${percentage.toFixed(0)}% of your ${limitType} limit`,
            data: {
                type: 'limit_warning',
                cardId,
                limitType,
                current,
                limit,
                percentage
            }
        });
    }
    /**
     * Notify user of limit exceeded
     */
    async notifyLimitExceeded(userId, cardId, limitType) {
        await this.sendToUser(userId, {
            title: 'Spending Limit Exceeded',
            body: `Your ${limitType} limit has been exceeded`,
            data: {
                type: 'limit_exceeded',
                cardId,
                limitType
            }
        });
    }
    /**
     * Notify user of subscription renewal
     */
    async notifySubscriptionRenewal(userId, subscription) {
        await this.sendToUser(userId, {
            title: 'Subscription Renewal',
            body: `${subscription.merchant} - ${subscription.currency} ${subscription.amount.toLocaleString()}`,
            data: {
                type: 'subscription_renewal',
                merchant: subscription.merchant,
                amount: subscription.amount
            }
        });
    }
    /**
     * Notify user of upcoming subscription charge
     */
    async notifyUpcomingSubscription(userId, subscription) {
        const daysUntil = Math.ceil((subscription.nextCharge.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        await this.sendToUser(userId, {
            title: 'Upcoming Subscription',
            body: `${subscription.merchant} will charge in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`,
            data: {
                type: 'upcoming_subscription',
                merchant: subscription.merchant,
                amount: subscription.amount,
                nextCharge: subscription.nextCharge.toISOString()
            }
        });
    }
    /**
     * Notify user of card status change
     */
    async notifyCardStatusChange(userId, cardId, status) {
        const statusMessages = {
            FROZEN: 'Your card has been frozen',
            ACTIVE: 'Your card has been activated',
            CLOSED: 'Your card has been closed'
        };
        await this.sendToUser(userId, {
            title: 'Card Status Changed',
            body: statusMessages[status],
            data: {
                type: 'card_status',
                cardId,
                status
            }
        });
    }
    /**
     * Notify user of budget warning
     */
    async notifyBudgetWarning(userId, category, spent, budget, percentage) {
        await this.sendToUser(userId, {
            title: 'Budget Warning',
            body: `You've used ${percentage.toFixed(0)}% of your ${category} budget`,
            data: {
                type: 'budget_warning',
                category,
                spent,
                budget,
                percentage
            }
        });
    }
    /**
     * Notify user of budget exceeded
     */
    async notifyBudgetExceeded(userId, category, spent, budget) {
        await this.sendToUser(userId, {
            title: 'Budget Exceeded',
            body: `You've exceeded your ${category} budget by ${(spent - budget).toLocaleString()}`,
            data: {
                type: 'budget_exceeded',
                category,
                spent,
                budget
            }
        });
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map