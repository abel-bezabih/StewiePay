"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebhookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../prisma/prisma.service");
const issuer_webhook_dto_1 = require("./dto/issuer-webhook.dto");
const psp_webhook_dto_1 = require("./dto/psp-webhook.dto");
const client_1 = require("@prisma/client");
const notification_service_1 = require("../notifications/notification.service");
const transaction_category_service_1 = require("../transactions/transaction-category.service");
const psp_adapter_1 = require("../integrations/psp/psp.adapter");
let WebhookService = WebhookService_1 = class WebhookService {
    constructor(prisma, notificationService, categoryService, psp) {
        this.prisma = prisma;
        this.notificationService = notificationService;
        this.categoryService = categoryService;
        this.psp = psp;
        this.logger = new common_1.Logger(WebhookService_1.name);
    }
    secureEqualHex(a, b) {
        const aBuf = Buffer.from(a, 'hex');
        const bBuf = Buffer.from(b, 'hex');
        if (aBuf.length !== bBuf.length)
            return false;
        return crypto.timingSafeEqual(aBuf, bBuf);
    }
    resolveWebhookSecret(name) {
        const secret = process.env[name];
        if (secret)
            return secret;
        if (process.env.NODE_ENV === 'production') {
            throw new common_1.BadRequestException(`${name} is required in production`);
        }
        return '';
    }
    async isDuplicateWebhook(source, webhookId) {
        const existing = await this.prisma.webhookLog.findUnique({
            where: {
                webhookId_source: {
                    webhookId,
                    source
                }
            },
            select: { id: true }
        });
        return Boolean(existing);
    }
    /**
     * Verify webhook signature (implement based on your issuer/PSP requirements)
     */
    verifySignature(payload, signature, secret) {
        if (!secret) {
            if (process.env.NODE_ENV === 'development') {
                this.logger.warn('Webhook secret not configured in development; skipping signature verification');
                return true;
            }
            return false;
        }
        if (!signature) {
            if (process.env.NODE_ENV === 'development') {
                this.logger.warn('Skipping webhook signature verification in development (missing signature)');
                return true;
            }
            return false;
        }
        const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
        const normalized = signature.trim().toLowerCase();
        const candidate = normalized.startsWith('sha256=') ? normalized.slice(7) : normalized;
        if (!/^[0-9a-f]+$/.test(candidate) || candidate.length !== expected.length) {
            return false;
        }
        try {
            return this.secureEqualHex(expected, candidate);
        }
        catch {
            return false;
        }
    }
    verifyChapaSignature(payload, signature, secret) {
        if (!signature || !secret)
            return false;
        const body = JSON.stringify(payload);
        const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
        const normalized = signature.trim().toLowerCase();
        const candidate = normalized.startsWith('sha256=') ? normalized.slice(7) : normalized;
        if (!/^[0-9a-f]+$/.test(candidate) || candidate.length !== expected.length) {
            return false;
        }
        try {
            return this.secureEqualHex(expected, candidate);
        }
        catch {
            return false;
        }
    }
    async processChapaWebhook(payload, signature) {
        const webhookSecret = this.resolveWebhookSecret('CHAPA_WEBHOOK_SECRET');
        const verifyOnWebhook = process.env.CHAPA_VERIFY_ON_WEBHOOK !== 'false';
        if (webhookSecret) {
            const valid = this.verifyChapaSignature(payload, signature, webhookSecret);
            if (!valid) {
                throw new common_1.BadRequestException('Invalid Chapa webhook signature');
            }
        }
        else if (process.env.NODE_ENV === 'development') {
            this.logger.warn('CHAPA_WEBHOOK_SECRET not set; skipping signature verification in development');
        }
        const txRef = payload?.tx_ref || payload?.reference;
        if (!txRef) {
            throw new common_1.BadRequestException('Missing tx_ref in Chapa webhook payload');
        }
        let status = client_1.TopUpStatus.PENDING;
        if (verifyOnWebhook) {
            const verified = await this.psp.verifyTopUp(txRef);
            status =
                verified.status === 'COMPLETED'
                    ? client_1.TopUpStatus.COMPLETED
                    : verified.status === 'FAILED'
                        ? client_1.TopUpStatus.FAILED
                        : client_1.TopUpStatus.PENDING;
        }
        else {
            const rawStatus = String(payload?.status || '').toLowerCase();
            status =
                rawStatus === 'success'
                    ? client_1.TopUpStatus.COMPLETED
                    : rawStatus === 'failed'
                        ? client_1.TopUpStatus.FAILED
                        : client_1.TopUpStatus.PENDING;
        }
        const topUp = await this.prisma.topUp.findFirst({
            where: { reference: txRef }
        });
        if (!topUp) {
            this.logger.warn(`Top-up not found for tx_ref: ${txRef}`);
            return { processed: false, reason: 'topup_not_found' };
        }
        const nextFundingState = status === client_1.TopUpStatus.COMPLETED
            ? client_1.TopUpFundingState.PSP_CONFIRMED
            : status === client_1.TopUpStatus.FAILED
                ? client_1.TopUpFundingState.FAILED
                : client_1.TopUpFundingState.PSP_PENDING;
        await this.prisma.topUp.update({
            where: { id: topUp.id },
            data: {
                status,
                fundingState: nextFundingState,
                pspCompletedAt: status === client_1.TopUpStatus.COMPLETED ? new Date() : topUp.pspCompletedAt,
                settlementFailureReason: status === client_1.TopUpStatus.FAILED ? 'Chapa webhook marked top-up as failed.' : topUp.settlementFailureReason
            }
        });
        await this.logFundingEvent(topUp.id, {
            source: 'PSP',
            eventType: 'topup.chapa_webhook',
            fromState: topUp.fundingState,
            toState: nextFundingState,
            message: `Chapa webhook resolved as ${status}.`,
            payload
        });
        await this.logWebhook('chapa', txRef, `chapa.${String(status).toLowerCase()}`, true);
        this.logger.log(`Chapa webhook processed: ${txRef} -> ${status}`);
        return { processed: true, status };
    }
    /**
     * Process issuer webhook
     */
    async processIssuerWebhook(dto) {
        this.logger.log(`Processing issuer webhook: ${dto.eventType} (${dto.webhookId})`);
        // Verify signature (if provided)
        const webhookSecret = this.resolveWebhookSecret('ISSUER_WEBHOOK_SECRET');
        if (!this.verifySignature(dto, dto.signature, webhookSecret)) {
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
        // Check for duplicate webhook (idempotency)
        if (await this.isDuplicateWebhook('issuer', dto.webhookId)) {
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
            case issuer_webhook_dto_1.IssuerWebhookEventType.FUNDING_PENDING:
                return this.handleFundingPending(dto);
            case issuer_webhook_dto_1.IssuerWebhookEventType.FUNDING_LOADED:
                return this.handleFundingLoaded(dto);
            case issuer_webhook_dto_1.IssuerWebhookEventType.FUNDING_FAILED:
                return this.handleFundingFailed(dto);
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
        const webhookSecret = this.resolveWebhookSecret('PSP_WEBHOOK_SECRET');
        if (!this.verifySignature(dto, dto.signature, webhookSecret)) {
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
        // Check for duplicate
        if (await this.isDuplicateWebhook('psp', dto.webhookId)) {
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
            include: { ownerUser: true }
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
                    include: { ownerUser: true }
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
        const ownerUserId = transaction.card.ownerUserId;
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
        }
        // Auto-close burner cards after first settled transaction
        this.closeBurnerCardIfNeeded(transaction.card).catch((err) => {
            this.logger.error('Failed to auto-close burner card:', err);
        });
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
        const ownerUserId = card.ownerUserId;
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
            include: { ownerUser: true }
        });
        if (!card) {
            return { processed: false, reason: 'card_not_found' };
        }
        await this.prisma.card.update({
            where: { id: card.id },
            data: { status: 'ACTIVE' }
        });
        const ownerUserId = card.ownerUserId;
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
            include: { ownerUser: true }
        });
        if (!card) {
            return { processed: false, reason: 'card_not_found' };
        }
        await this.prisma.card.update({
            where: { id: card.id },
            data: { status: 'CLOSED' }
        });
        const ownerUserId = card.ownerUserId;
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
                data: {
                    status: client_1.TopUpStatus.PENDING,
                    fundingState: client_1.TopUpFundingState.PSP_PENDING
                }
            });
            await this.logFundingEvent(topUp.id, {
                source: 'PSP',
                eventType: dto.eventType,
                fromState: topUp.fundingState,
                toState: client_1.TopUpFundingState.PSP_PENDING,
                message: 'PSP reported top-up still pending.',
                payload: dto
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
                data: {
                    status: client_1.TopUpStatus.COMPLETED,
                    fundingState: client_1.TopUpFundingState.PSP_CONFIRMED,
                    pspCompletedAt: new Date()
                }
            });
            await this.logFundingEvent(topUp.id, {
                source: 'PSP',
                eventType: dto.eventType,
                fromState: topUp.fundingState,
                toState: client_1.TopUpFundingState.PSP_CONFIRMED,
                message: 'PSP confirmed top-up funding.',
                payload: dto
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
                data: {
                    status: client_1.TopUpStatus.FAILED,
                    fundingState: client_1.TopUpFundingState.FAILED,
                    settlementFailureReason: dto.failureReason || 'PSP reported top-up failure'
                }
            });
            await this.logFundingEvent(topUp.id, {
                source: 'PSP',
                eventType: dto.eventType,
                fromState: topUp.fundingState,
                toState: client_1.TopUpFundingState.FAILED,
                message: dto.failureReason || 'PSP reported top-up failure.',
                payload: dto
            });
        }
        await this.logWebhook('psp', dto.webhookId, dto.eventType, true);
        return { processed: true };
    }
    async handleFundingPending(dto) {
        if (!dto.funding?.topUpReference) {
            throw new common_1.BadRequestException('Funding data missing');
        }
        const topUp = await this.prisma.topUp.findFirst({
            where: { reference: dto.funding.topUpReference }
        });
        if (!topUp) {
            return { processed: false, reason: 'topup_not_found' };
        }
        await this.prisma.topUp.update({
            where: { id: topUp.id },
            data: {
                fundingState: client_1.TopUpFundingState.ISSUER_PENDING
            }
        });
        await this.logFundingEvent(topUp.id, {
            source: 'ISSUER',
            eventType: dto.eventType,
            fromState: topUp.fundingState,
            toState: client_1.TopUpFundingState.ISSUER_PENDING,
            message: 'Issuer acknowledged funding and is processing card load.',
            payload: dto
        });
        await this.logWebhook('issuer', dto.webhookId, dto.eventType, true);
        return { processed: true };
    }
    async handleFundingLoaded(dto) {
        if (!dto.funding?.topUpReference) {
            throw new common_1.BadRequestException('Funding data missing');
        }
        const topUp = await this.prisma.topUp.findFirst({
            where: { reference: dto.funding.topUpReference }
        });
        if (!topUp) {
            return { processed: false, reason: 'topup_not_found' };
        }
        await this.prisma.topUp.update({
            where: { id: topUp.id },
            data: {
                status: client_1.TopUpStatus.COMPLETED,
                fundingState: client_1.TopUpFundingState.CARD_LOADED,
                issuerLoadedAt: dto.funding.timestamp ? new Date(dto.funding.timestamp) : new Date(),
                settlementFailureReason: null
            }
        });
        await this.logFundingEvent(topUp.id, {
            source: 'ISSUER',
            eventType: dto.eventType,
            fromState: topUp.fundingState,
            toState: client_1.TopUpFundingState.CARD_LOADED,
            message: 'Issuer confirmed card balance load completion.',
            payload: dto
        });
        await this.logWebhook('issuer', dto.webhookId, dto.eventType, true);
        return { processed: true };
    }
    async handleFundingFailed(dto) {
        if (!dto.funding?.topUpReference) {
            throw new common_1.BadRequestException('Funding data missing');
        }
        const topUp = await this.prisma.topUp.findFirst({
            where: { reference: dto.funding.topUpReference }
        });
        if (!topUp) {
            return { processed: false, reason: 'topup_not_found' };
        }
        await this.prisma.topUp.update({
            where: { id: topUp.id },
            data: {
                status: client_1.TopUpStatus.FAILED,
                fundingState: client_1.TopUpFundingState.FAILED,
                settlementFailureReason: dto.funding.reason || 'Issuer reported card load failure'
            }
        });
        await this.logFundingEvent(topUp.id, {
            source: 'ISSUER',
            eventType: dto.eventType,
            fromState: topUp.fundingState,
            toState: client_1.TopUpFundingState.FAILED,
            message: dto.funding.reason || 'Issuer reported card load failure.',
            payload: dto
        });
        await this.logWebhook('issuer', dto.webhookId, dto.eventType, true);
        return { processed: true };
    }
    async logFundingEvent(topUpId, event) {
        await this.prisma.fundingSettlementEvent.create({
            data: {
                topUpId,
                source: event.source,
                eventType: event.eventType,
                fromState: event.fromState,
                toState: event.toState,
                message: event.message,
                payload: event.payload
            }
        });
    }
    async logWebhook(source, webhookId, eventType, success) {
        try {
            await this.prisma.webhookLog.create({
                data: {
                    webhookId,
                    source,
                    eventType,
                    success
                }
            });
        }
        catch (error) {
            this.logger.warn(`Webhook log write failed: ${String(error.message || error)}`);
        }
    }
};
exports.WebhookService = WebhookService;
exports.WebhookService = WebhookService = WebhookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)(psp_adapter_1.PSP_ADAPTER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService,
        transaction_category_service_1.TransactionCategoryService, Object])
], WebhookService);
//# sourceMappingURL=webhook.service.js.map