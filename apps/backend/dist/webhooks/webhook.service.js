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
var WebhookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const issuer_webhook_dto_1 = require("./dto/issuer-webhook.dto");
const psp_webhook_dto_1 = require("./dto/psp-webhook.dto");
const client_1 = require("@prisma/client");
const notification_service_1 = require("../notifications/notification.service");
const subscription_detection_service_1 = require("../subscriptions/subscription-detection.service");
const transaction_category_service_1 = require("../transactions/transaction-category.service");
let WebhookService = WebhookService_1 = class WebhookService {
    constructor(prisma, notificationService, subscriptionDetection, categoryService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
        this.subscriptionDetection = subscriptionDetection;
        this.categoryService = categoryService;
        this.logger = new common_1.Logger(WebhookService_1.name);
    }
    /**
     * Verify webhook signature (implement based on your issuer/PSP requirements)
     */
    verifySignature(payload, signature, secret) {
        // TODO: Implement signature verification based on issuer/PSP requirements
        // Example: HMAC SHA256 verification
        // For now, we'll skip verification in development
        if (process.env.NODE_ENV === 'development' && !signature) {
            this.logger.warn('Skipping webhook signature verification in development');
            return true;
        }
        // In production, implement proper signature verification
        // const expectedSignature = crypto.createHmac('sha256', secret)
        //   .update(JSON.stringify(payload))
        //   .digest('hex');
        // return signature === expectedSignature;
        return true; // Placeholder
    }
    /**
     * Process issuer webhook
     */
    async processIssuerWebhook(dto) {
        this.logger.log(`Processing issuer webhook: ${dto.eventType} (${dto.webhookId})`);
        // Verify signature (if provided)
        const webhookSecret = process.env.ISSUER_WEBHOOK_SECRET || 'dev-secret';
        if (!this.verifySignature(dto, dto.signature, webhookSecret)) {
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
        // Check for duplicate webhook (idempotency)
        const existingWebhook = await this.prisma.$queryRaw `
      SELECT id FROM "WebhookLog" WHERE "webhookId" = ${dto.webhookId} AND "source" = 'issuer'
    `.catch(() => null);
        if (existingWebhook) {
            this.logger.warn(`Duplicate webhook ignored: ${dto.webhookId}`);
            return { processed: false, reason: 'duplicate' };
        }
        // Process based on event type
        switch (dto.eventType) {
            case issuer_webhook_dto_1.IssuerWebhookEventType.TRANSACTION_AUTHORIZED:
                return this.handleTransactionAuthorized(dto);
            case issuer_webhook_dto_1.IssuerWebhookEventType.TRANSACTION_SETTLED:
                return this.handleTransactionSettled(dto);
            case issuer_webhook_dto_1.IssuerWebhookEventType.TRANSACTION_DECLINED:
                return this.handleTransactionDeclined(dto);
            case issuer_webhook_dto_1.IssuerWebhookEventType.CARD_FROZEN:
                return this.handleCardFrozen(dto);
            case issuer_webhook_dto_1.IssuerWebhookEventType.CARD_UNFROZEN:
                return this.handleCardUnfrozen(dto);
            case issuer_webhook_dto_1.IssuerWebhookEventType.CARD_CLOSED:
                return this.handleCardClosed(dto);
            case issuer_webhook_dto_1.IssuerWebhookEventType.CARD_LIMIT_UPDATED:
                return this.handleCardLimitUpdated(dto);
            default:
                this.logger.warn(`Unknown event type: ${dto.eventType}`);
                return { processed: false, reason: 'unknown_event_type' };
        }
    }
    /**
     * Process PSP webhook
     */
    async processPspWebhook(dto) {
        this.logger.log(`Processing PSP webhook: ${dto.eventType} (${dto.webhookId})`);
        // Verify signature
        const webhookSecret = process.env.PSP_WEBHOOK_SECRET || 'dev-secret';
        if (!this.verifySignature(dto, dto.signature, webhookSecret)) {
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
        // Check for duplicate
        const existingWebhook = await this.prisma.$queryRaw `
      SELECT id FROM "WebhookLog" WHERE "webhookId" = ${dto.webhookId} AND "source" = 'psp'
    `.catch(() => null);
        if (existingWebhook) {
            this.logger.warn(`Duplicate webhook ignored: ${dto.webhookId}`);
            return { processed: false, reason: 'duplicate' };
        }
        // Process based on event type
        switch (dto.eventType) {
            case psp_webhook_dto_1.PspWebhookEventType.TOPUP_PENDING:
                return this.handleTopUpPending(dto);
            case psp_webhook_dto_1.PspWebhookEventType.TOPUP_COMPLETED:
                return this.handleTopUpCompleted(dto);
            case psp_webhook_dto_1.PspWebhookEventType.TOPUP_FAILED:
                return this.handleTopUpFailed(dto);
            default:
                this.logger.warn(`Unknown event type: ${dto.eventType}`);
                return { processed: false, reason: 'unknown_event_type' };
        }
    }
    async handleTransactionAuthorized(dto) {
        if (!dto.transaction) {
            throw new common_1.BadRequestException('Transaction data missing');
        }
        const card = await this.prisma.card.findFirst({
            where: { issuerCardId: dto.transaction.cardId },
            include: {
                ownerUser: true,
                ownerOrg: true
            }
        });
        if (!card) {
            this.logger.warn(`Card not found: ${dto.transaction.cardId}`);
            return { processed: false, reason: 'card_not_found' };
        }
        // Check if transaction already exists
        const existing = await this.prisma.transaction.findUnique({
            where: { id: dto.transaction.transactionId }
        });
        if (existing) {
            return { processed: false, reason: 'duplicate_transaction' };
        }
        // Auto-categorize if not provided
        const category = dto.transaction.category || this.categoryService.categorize(dto.transaction.merchantName, dto.transaction.mcc);
        // Create transaction
        const transaction = await this.prisma.transaction.create({
            data: {
                id: dto.transaction.transactionId,
                cardId: card.id,
                amount: dto.transaction.amount,
                currency: dto.transaction.currency,
                merchantName: dto.transaction.merchantName,
                mcc: dto.transaction.mcc,
                category,
                status: client_1.TransactionStatus.AUTHORIZED,
                timestamp: new Date(dto.transaction.timestamp)
            }
        });
        // Log webhook
        await this.logWebhook('issuer', dto.webhookId, dto.eventType, true);
        return { processed: true, transactionId: transaction.id };
    }
    async handleTransactionSettled(dto) {
        if (!dto.transaction) {
            throw new common_1.BadRequestException('Transaction data missing');
        }
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: dto.transaction.transactionId },
            include: {
                card: {
                    include: {
                        ownerUser: true,
                        ownerOrg: true
                    }
                }
            }
        });
        if (!transaction) {
            this.logger.warn(`Transaction not found: ${dto.transaction.transactionId}`);
            return { processed: false, reason: 'transaction_not_found' };
        }
        // Update transaction status
        await this.prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: client_1.TransactionStatus.SETTLED }
        });
        // Get owner for notifications
        let ownerUserId = transaction.card.ownerUserId;
        if (!ownerUserId && transaction.card.ownerOrgId) {
            const org = await this.prisma.organization.findUnique({
                where: { id: transaction.card.ownerOrgId },
                select: { ownerId: true }
            });
            ownerUserId = org?.ownerId ?? null;
        }
        if (ownerUserId) {
            // Send notification
            this.notificationService
                .notifyTransaction(ownerUserId, {
                amount: transaction.amount,
                currency: transaction.currency,
                merchantName: transaction.merchantName,
                cardId: transaction.cardId
            })
                .catch(err => this.logger.error('Notification failed:', err));
            // Detect subscriptions
            this.subscriptionDetection
                .detectAndUpdateSubscriptions(transaction.cardId, transaction.id)
                .catch((err) => this.logger.error('Subscription detection failed:', err));
        }
        // Log webhook
        await this.logWebhook('issuer', dto.webhookId, dto.eventType, true);
        return { processed: true, transactionId: transaction.id };
    }
    async handleTransactionDeclined(dto) {
        if (!dto.transaction) {
            throw new common_1.BadRequestException('Transaction data missing');
        }
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: dto.transaction.transactionId }
        });
        if (transaction) {
            await this.prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: client_1.TransactionStatus.DECLINED }
            });
        }
        else {
            // Create declined transaction record
            const card = await this.prisma.card.findFirst({
                where: { issuerCardId: dto.transaction.cardId }
            });
            if (card) {
                await this.prisma.transaction.create({
                    data: {
                        id: dto.transaction.transactionId,
                        cardId: card.id,
                        amount: dto.transaction.amount,
                        currency: dto.transaction.currency,
                        merchantName: dto.transaction.merchantName,
                        mcc: dto.transaction.mcc,
                        category: dto.transaction.category || 'Other',
                        status: client_1.TransactionStatus.DECLINED,
                        timestamp: new Date(dto.transaction.timestamp)
                    }
                });
            }
        }
        await this.logWebhook('issuer', dto.webhookId, dto.eventType, true);
        return { processed: true };
    }
    async handleCardFrozen(dto) {
        if (!dto.card) {
            throw new common_1.BadRequestException('Card data missing');
        }
        const card = await this.prisma.card.findFirst({
            where: { issuerCardId: dto.card.cardId },
            include: {
                ownerUser: true,
                ownerOrg: true
            }
        });
        if (!card) {
            return { processed: false, reason: 'card_not_found' };
        }
        await this.prisma.card.update({
            where: { id: card.id },
            data: { status: 'FROZEN' }
        });
        let ownerUserId = card.ownerUserId;
        if (!ownerUserId && card.ownerOrgId) {
            const org = await this.prisma.organization.findUnique({
                where: { id: card.ownerOrgId },
                select: { ownerId: true }
            });
            ownerUserId = org?.ownerId ?? null;
        }
        if (ownerUserId) {
            this.notificationService
                .notifyCardStatusChange(ownerUserId, card.id, 'FROZEN')
                .catch(err => this.logger.error('Notification failed:', err));
        }
        await this.logWebhook('issuer', dto.webhookId, dto.eventType, true);
        return { processed: true };
    }
    async handleCardUnfrozen(dto) {
        if (!dto.card) {
            throw new common_1.BadRequestException('Card data missing');
        }
        const card = await this.prisma.card.findFirst({
            where: { issuerCardId: dto.card.cardId },
            include: {
                ownerUser: true,
                ownerOrg: true
            }
        });
        if (!card) {
            return { processed: false, reason: 'card_not_found' };
        }
        await this.prisma.card.update({
            where: { id: card.id },
            data: { status: 'ACTIVE' }
        });
        let ownerUserId = card.ownerUserId;
        if (!ownerUserId && card.ownerOrgId) {
            const org = await this.prisma.organization.findUnique({
                where: { id: card.ownerOrgId },
                select: { ownerId: true }
            });
            ownerUserId = org?.ownerId ?? null;
        }
        if (ownerUserId) {
            this.notificationService
                .notifyCardStatusChange(ownerUserId, card.id, 'ACTIVE')
                .catch(err => this.logger.error('Notification failed:', err));
        }
        await this.logWebhook('issuer', dto.webhookId, dto.eventType, true);
        return { processed: true };
    }
    async handleCardClosed(dto) {
        if (!dto.card) {
            throw new common_1.BadRequestException('Card data missing');
        }
        const card = await this.prisma.card.findFirst({
            where: { issuerCardId: dto.card.cardId },
            include: {
                ownerUser: true,
                ownerOrg: true
            }
        });
        if (!card) {
            return { processed: false, reason: 'card_not_found' };
        }
        await this.prisma.card.update({
            where: { id: card.id },
            data: { status: 'CLOSED' }
        });
        let ownerUserId = card.ownerUserId;
        if (!ownerUserId && card.ownerOrgId) {
            const org = await this.prisma.organization.findUnique({
                where: { id: card.ownerOrgId },
                select: { ownerId: true }
            });
            ownerUserId = org?.ownerId ?? null;
        }
        if (ownerUserId) {
            this.notificationService
                .notifyCardStatusChange(ownerUserId, card.id, 'CLOSED')
                .catch(err => this.logger.error('Notification failed:', err));
        }
        await this.logWebhook('issuer', dto.webhookId, dto.eventType, true);
        return { processed: true };
    }
    async handleCardLimitUpdated(dto) {
        if (!dto.card) {
            throw new common_1.BadRequestException('Card data missing');
        }
        const card = await this.prisma.card.findFirst({
            where: { issuerCardId: dto.card.cardId }
        });
        if (!card) {
            return { processed: false, reason: 'card_not_found' };
        }
        await this.prisma.card.update({
            where: { id: card.id },
            data: {
                limitDaily: dto.card.limitDaily,
                limitMonthly: dto.card.limitMonthly,
                limitPerTxn: dto.card.limitPerTxn
            }
        });
        await this.logWebhook('issuer', dto.webhookId, dto.eventType, true);
        return { processed: true };
    }
    async handleTopUpPending(dto) {
        const topUp = await this.prisma.topUp.findFirst({
            where: { reference: dto.providerReference }
        });
        if (topUp) {
            await this.prisma.topUp.update({
                where: { id: topUp.id },
                data: { status: client_1.TopUpStatus.PENDING }
            });
        }
        await this.logWebhook('psp', dto.webhookId, dto.eventType, true);
        return { processed: true };
    }
    async handleTopUpCompleted(dto) {
        const topUp = await this.prisma.topUp.findFirst({
            where: { reference: dto.providerReference }
        });
        if (topUp) {
            await this.prisma.topUp.update({
                where: { id: topUp.id },
                data: { status: client_1.TopUpStatus.COMPLETED }
            });
        }
        await this.logWebhook('psp', dto.webhookId, dto.eventType, true);
        return { processed: true };
    }
    async handleTopUpFailed(dto) {
        const topUp = await this.prisma.topUp.findFirst({
            where: { reference: dto.providerReference }
        });
        if (topUp) {
            await this.prisma.topUp.update({
                where: { id: topUp.id },
                data: { status: client_1.TopUpStatus.FAILED }
            });
        }
        await this.logWebhook('psp', dto.webhookId, dto.eventType, true);
        return { processed: true };
    }
    async logWebhook(source, webhookId, eventType, success) {
        // Note: This assumes a WebhookLog table exists. If not, we can skip logging or create the table.
        // For now, we'll just log to console
        this.logger.log(`Webhook logged: ${source} - ${webhookId} - ${eventType} - ${success ? 'success' : 'failed'}`);
    }
};
exports.WebhookService = WebhookService;
exports.WebhookService = WebhookService = WebhookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService,
        subscription_detection_service_1.SubscriptionDetectionService,
        transaction_category_service_1.TransactionCategoryService])
], WebhookService);
//# sourceMappingURL=webhook.service.js.map