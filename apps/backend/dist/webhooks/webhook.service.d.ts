import { PrismaService } from '../prisma/prisma.service';
import { IssuerWebhookDto } from './dto/issuer-webhook.dto';
import { PspWebhookDto } from './dto/psp-webhook.dto';
import { NotificationService } from '../notifications/notification.service';
import { TransactionCategoryService } from '../transactions/transaction-category.service';
import { PspAdapter } from '../integrations/psp/psp.adapter';
export declare class WebhookService {
    private prisma;
    private notificationService;
    private categoryService;
    private psp;
    private readonly logger;
    constructor(prisma: PrismaService, notificationService: NotificationService, categoryService: TransactionCategoryService, psp: PspAdapter);
    private secureEqualHex;
    private resolveWebhookSecret;
    private isDuplicateWebhook;
    /**
     * Verify webhook signature (implement based on your issuer/PSP requirements)
     */
    private verifySignature;
    private verifyChapaSignature;
    processChapaWebhook(payload: any, signature?: string): Promise<{
        processed: boolean;
        reason: string;
        status?: undefined;
    } | {
        processed: boolean;
        status: import(".prisma/client").$Enums.TopUpStatus;
        reason?: undefined;
    }>;
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
    private closeBurnerCardIfNeeded;
    private handleCardFrozen;
    private handleCardUnfrozen;
    private handleCardClosed;
    private handleCardLimitUpdated;
    private handleTopUpPending;
    private handleTopUpCompleted;
    private handleTopUpFailed;
    private handleFundingPending;
    private handleFundingLoaded;
    private handleFundingFailed;
    private logFundingEvent;
    private logWebhook;
}
