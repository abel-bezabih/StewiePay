import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Send push notification to user
   */
  async sendToUser(userId: string, payload: NotificationPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true, notificationPreferences: true }
    });

    if (!user || !user.pushToken) {
      return; // User hasn't registered for push notifications
    }

    // Check notification preferences
    const prefs = (user.notificationPreferences as any) || {};
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
  async registerPushToken(userId: string, token: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { pushToken: token }
    });
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(userId: string, preferences: {
    transactions?: boolean;
    limits?: boolean;
    subscriptions?: boolean;
    cardStatus?: boolean;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true }
    });

    const currentPrefs = (user?.notificationPreferences as any) || {};
    const newPrefs = { ...currentPrefs, ...preferences };

    return this.prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: newPrefs }
    });
  }

  /**
   * Notify user of new transaction
   */
  async notifyTransaction(userId: string, transaction: {
    amount: number;
    currency: string;
    merchantName: string;
    cardId: string;
  }) {
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
  async notifyLimitWarning(userId: string, cardId: string, limitType: 'daily' | 'monthly', current: number, limit: number, percentage: number) {
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
  async notifyLimitExceeded(userId: string, cardId: string, limitType: 'daily' | 'monthly') {
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
  async notifySubscriptionRenewal(userId: string, subscription: {
    merchant: string;
    amount: number;
    currency: string;
  }) {
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
  async notifyUpcomingSubscription(userId: string, subscription: {
    merchant: string;
    amount: number;
    nextCharge: Date;
  }) {
    const daysUntil = Math.ceil(
      (subscription.nextCharge.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

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
  async notifyCardStatusChange(userId: string, cardId: string, status: 'FROZEN' | 'ACTIVE' | 'CLOSED') {
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
  async notifyBudgetWarning(
    userId: string,
    category: string,
    spent: number,
    budget: number,
    percentage: number
  ) {
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
  async notifyBudgetExceeded(
    userId: string,
    category: string,
    spent: number,
    budget: number
  ) {
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
}

