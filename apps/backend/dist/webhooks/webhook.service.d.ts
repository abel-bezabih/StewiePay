import { PrismaService } from '../prisma/prisma.service';
import { IssuerWebhookDto } from './dto/issuer-webhook.dto';
import { PspWebhookDto } from './dto/psp-webhook.dto';
import { NotificationService } from '../notifications/notification.service';
import { SubscriptionDetectionService } from '../subscriptions/subscription-detection.service';
import { TransactionCategoryService } from '../transactions/transaction-category.service';
export declare class WebhookService {
    private prisma;
    private notificationService;
    private subscriptionDetection;
    private categoryService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationService: NotificationService, subscriptionDetection: SubscriptionDetectionService, categoryService: TransactionCategoryService);
    /**
     * Verify webhook signature (implement based on your issuer/PSP requirements)
     */
    private verifySignature;
    /**
     * Process issuer webhook
     */
    processIssuerWebhook(dto: IssuerWebhookDto): Promise<{
        processed: boolean;
    } | {
        processed: boolean;
        reason: string;
    }>;
    /**
     * Process PSP webhook
     */
    processPspWebhook(dto: PspWebhookDto): Promise<{
        processed: boolean;
    } | {
        processed: boolean;
        reason: string;
    }>;
    private handleTransactionAuthorized;
    private handleTransactionSettled;
    private handleTransactionDeclined;
    private handleCardFrozen;
    private handleCardUnfrozen;
    private handleCardClosed;
    private handleCardLimitUpdated;
    private handleTopUpPending;
    private handleTopUpCompleted;
    private handleTopUpFailed;
    private logWebhook;
}
