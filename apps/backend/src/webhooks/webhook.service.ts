import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { IssuerWebhookDto, IssuerWebhookEventType } from './dto/issuer-webhook.dto';
import { PspWebhookDto, PspWebhookEventType } from './dto/psp-webhook.dto';
import { CardStatus, CardType, TopUpFundingState, TransactionStatus, TopUpStatus } from '@prisma/client';
import { NotificationService } from '../notifications/notification.service';
import { TransactionCategoryService } from '../transactions/transaction-category.service';
import { PSP_ADAPTER, PspAdapter } from '../integrations/psp/psp.adapter';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private categoryService: TransactionCategoryService,
    @Inject(PSP_ADAPTER) private psp: PspAdapter
  ) {}

  private secureEqualHex(a: string, b: string): boolean {
    const aBuf = Buffer.from(a, 'hex');
    const bBuf = Buffer.from(b, 'hex');
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
  }

  private resolveWebhookSecret(name: 'ISSUER_WEBHOOK_SECRET' | 'PSP_WEBHOOK_SECRET' | 'CHAPA_WEBHOOK_SECRET') {
    const secret = process.env[name];
    if (secret) return secret;
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException(`${name} is required in production`);
    }
    return '';
  }

  private async isDuplicateWebhook(source: 'issuer' | 'psp', webhookId: string) {
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
  private verifySignature(payload: any, signature: string | undefined, secret: string): boolean {
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
    } catch {
      return false;
    }
  }

  private verifyChapaSignature(payload: any, signature: string | undefined, secret: string): boolean {
    if (!signature || !secret) return false;
    const body = JSON.stringify(payload);
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    const normalized = signature.trim().toLowerCase();
    const candidate = normalized.startsWith('sha256=') ? normalized.slice(7) : normalized;
    if (!/^[0-9a-f]+$/.test(candidate) || candidate.length !== expected.length) {
      return false;
    }
    try {
      return this.secureEqualHex(expected, candidate);
    } catch {
      return false;
    }
  }

  async processChapaWebhook(payload: any, signature?: string) {
    const webhookSecret = this.resolveWebhookSecret('CHAPA_WEBHOOK_SECRET');
    const verifyOnWebhook = process.env.CHAPA_VERIFY_ON_WEBHOOK !== 'false';

    if (webhookSecret) {
      const valid = this.verifyChapaSignature(payload, signature, webhookSecret);
      if (!valid) {
        throw new BadRequestException('Invalid Chapa webhook signature');
      }
    } else if (process.env.NODE_ENV === 'development') {
      this.logger.warn('CHAPA_WEBHOOK_SECRET not set; skipping signature verification in development');
    }

    const txRef = payload?.tx_ref || payload?.reference;
    if (!txRef) {
      throw new BadRequestException('Missing tx_ref in Chapa webhook payload');
    }

    let status: TopUpStatus = TopUpStatus.PENDING;
    if (verifyOnWebhook) {
      const verified = await this.psp.verifyTopUp(txRef);
      status =
        verified.status === 'COMPLETED'
          ? TopUpStatus.COMPLETED
          : verified.status === 'FAILED'
            ? TopUpStatus.FAILED
            : TopUpStatus.PENDING;
    } else {
      const rawStatus = String(payload?.status || '').toLowerCase();
      status =
        rawStatus === 'success'
          ? TopUpStatus.COMPLETED
          : rawStatus === 'failed'
            ? TopUpStatus.FAILED
            : TopUpStatus.PENDING;
    }

    const topUp = await this.prisma.topUp.findFirst({
      where: { reference: txRef }
    });

    if (!topUp) {
      this.logger.warn(`Top-up not found for tx_ref: ${txRef}`);
      return { processed: false, reason: 'topup_not_found' };
    }

    const nextFundingState =
      status === TopUpStatus.COMPLETED
        ? TopUpFundingState.PSP_CONFIRMED
        : status === TopUpStatus.FAILED
          ? TopUpFundingState.FAILED
          : TopUpFundingState.PSP_PENDING;

    await this.prisma.topUp.update({
      where: { id: topUp.id },
      data: {
        status,
        fundingState: nextFundingState,
        pspCompletedAt: status === TopUpStatus.COMPLETED ? new Date() : topUp.pspCompletedAt,
        settlementFailureReason: status === TopUpStatus.FAILED ? 'Chapa webhook marked top-up as failed.' : topUp.settlementFailureReason
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
  async processIssuerWebhook(dto: IssuerWebhookDto) {
    this.logger.log(`Processing issuer webhook: ${dto.eventType} (${dto.webhookId})`);

    // Verify signature (if provided)
    const webhookSecret = this.resolveWebhookSecret('ISSUER_WEBHOOK_SECRET');
    if (!this.verifySignature(dto, dto.signature, webhookSecret)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // Check for duplicate webhook (idempotency)
    if (await this.isDuplicateWebhook('issuer', dto.webhookId)) {
      this.logger.warn(`Duplicate webhook ignored: ${dto.webhookId}`);
      return { processed: false, reason: 'duplicate' };
    }

    // Process based on event type
    switch (dto.eventType) {
      case IssuerWebhookEventType.TRANSACTION_AUTHORIZED:
        return this.handleTransactionAuthorized(dto);
      case IssuerWebhookEventType.TRANSACTION_SETTLED:
        return this.handleTransactionSettled(dto);
      case IssuerWebhookEventType.TRANSACTION_DECLINED:
        return this.handleTransactionDeclined(dto);
      case IssuerWebhookEventType.CARD_FROZEN:
        return this.handleCardFrozen(dto);
      case IssuerWebhookEventType.CARD_UNFROZEN:
        return this.handleCardUnfrozen(dto);
      case IssuerWebhookEventType.CARD_CLOSED:
        return this.handleCardClosed(dto);
      case IssuerWebhookEventType.CARD_LIMIT_UPDATED:
        return this.handleCardLimitUpdated(dto);
      case IssuerWebhookEventType.FUNDING_PENDING:
        return this.handleFundingPending(dto);
      case IssuerWebhookEventType.FUNDING_LOADED:
        return this.handleFundingLoaded(dto);
      case IssuerWebhookEventType.FUNDING_FAILED:
        return this.handleFundingFailed(dto);
      default:
        this.logger.warn(`Unknown event type: ${dto.eventType}`);
        return { processed: false, reason: 'unknown_event_type' };
    }
  }

  /**
   * Process PSP webhook
   */
  async processPspWebhook(dto: PspWebhookDto) {
    this.logger.log(`Processing PSP webhook: ${dto.eventType} (${dto.webhookId})`);

    // Verify signature
    const webhookSecret = this.resolveWebhookSecret('PSP_WEBHOOK_SECRET');
    if (!this.verifySignature(dto, dto.signature, webhookSecret)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // Check for duplicate
    if (await this.isDuplicateWebhook('psp', dto.webhookId)) {
      this.logger.warn(`Duplicate webhook ignored: ${dto.webhookId}`);
      return { processed: false, reason: 'duplicate' };
    }

    // Process based on event type
    switch (dto.eventType) {
      case PspWebhookEventType.TOPUP_PENDING:
        return this.handleTopUpPending(dto);
      case PspWebhookEventType.TOPUP_COMPLETED:
        return this.handleTopUpCompleted(dto);
      case PspWebhookEventType.TOPUP_FAILED:
        return this.handleTopUpFailed(dto);
      default:
        this.logger.warn(`Unknown event type: ${dto.eventType}`);
        return { processed: false, reason: 'unknown_event_type' };
    }
  }

  private async handleTransactionAuthorized(dto: IssuerWebhookDto) {
    if (!dto.transaction) {
      throw new BadRequestException('Transaction data missing');
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
    const category = dto.transaction.category || this.categoryService.categorize(
      dto.transaction.merchantName,
      dto.transaction.mcc
    );

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
        status: TransactionStatus.AUTHORIZED,
        timestamp: new Date(dto.transaction.timestamp)
      }
    });

    // Log webhook
    await this.logWebhook('issuer', dto.webhookId, dto.eventType, true);

    return { processed: true, transactionId: transaction.id };
  }

  private async handleTransactionSettled(dto: IssuerWebhookDto) {
    if (!dto.transaction) {
      throw new BadRequestException('Transaction data missing');
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
      data: { status: TransactionStatus.SETTLED }
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

  private async handleTransactionDeclined(dto: IssuerWebhookDto) {
    if (!dto.transaction) {
      throw new BadRequestException('Transaction data missing');
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { id: dto.transaction.transactionId }
    });

    if (transaction) {
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.DECLINED }
      });
    } else {
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
            status: TransactionStatus.DECLINED,
            timestamp: new Date(dto.transaction.timestamp)
          }
        });
      }
    }

    await this.logWebhook('issuer', dto.webhookId, dto.eventType, true);
    return { processed: true };
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

  private async handleCardFrozen(dto: IssuerWebhookDto) {
    if (!dto.card) {
      throw new BadRequestException('Card data missing');
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

  private async handleCardUnfrozen(dto: IssuerWebhookDto) {
    if (!dto.card) {
      throw new BadRequestException('Card data missing');
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

  private async handleCardClosed(dto: IssuerWebhookDto) {
    if (!dto.card) {
      throw new BadRequestException('Card data missing');
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

  private async handleCardLimitUpdated(dto: IssuerWebhookDto) {
    if (!dto.card) {
      throw new BadRequestException('Card data missing');
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

  private async handleTopUpPending(dto: PspWebhookDto) {
    const topUp = await this.prisma.topUp.findFirst({
      where: { reference: dto.providerReference }
    });

    if (topUp) {
      await this.prisma.topUp.update({
        where: { id: topUp.id },
        data: {
          status: TopUpStatus.PENDING,
          fundingState: TopUpFundingState.PSP_PENDING
        }
      });
      await this.logFundingEvent(topUp.id, {
        source: 'PSP',
        eventType: dto.eventType,
        fromState: topUp.fundingState,
        toState: TopUpFundingState.PSP_PENDING,
        message: 'PSP reported top-up still pending.',
        payload: dto
      });
    }

    await this.logWebhook('psp', dto.webhookId, dto.eventType, true);
    return { processed: true };
  }

  private async handleTopUpCompleted(dto: PspWebhookDto) {
    const topUp = await this.prisma.topUp.findFirst({
      where: { reference: dto.providerReference }
    });

    if (topUp) {
      await this.prisma.topUp.update({
        where: { id: topUp.id },
        data: {
          status: TopUpStatus.COMPLETED,
          fundingState: TopUpFundingState.PSP_CONFIRMED,
          pspCompletedAt: new Date()
        }
      });
      await this.logFundingEvent(topUp.id, {
        source: 'PSP',
        eventType: dto.eventType,
        fromState: topUp.fundingState,
        toState: TopUpFundingState.PSP_CONFIRMED,
        message: 'PSP confirmed top-up funding.',
        payload: dto
      });
    }

    await this.logWebhook('psp', dto.webhookId, dto.eventType, true);
    return { processed: true };
  }

  private async handleTopUpFailed(dto: PspWebhookDto) {
    const topUp = await this.prisma.topUp.findFirst({
      where: { reference: dto.providerReference }
    });

    if (topUp) {
      await this.prisma.topUp.update({
        where: { id: topUp.id },
        data: {
          status: TopUpStatus.FAILED,
          fundingState: TopUpFundingState.FAILED,
          settlementFailureReason: dto.failureReason || 'PSP reported top-up failure'
        }
      });
      await this.logFundingEvent(topUp.id, {
        source: 'PSP',
        eventType: dto.eventType,
        fromState: topUp.fundingState,
        toState: TopUpFundingState.FAILED,
        message: dto.failureReason || 'PSP reported top-up failure.',
        payload: dto
      });
    }

    await this.logWebhook('psp', dto.webhookId, dto.eventType, true);
    return { processed: true };
  }

  private async handleFundingPending(dto: IssuerWebhookDto) {
    if (!dto.funding?.topUpReference) {
      throw new BadRequestException('Funding data missing');
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
        fundingState: TopUpFundingState.ISSUER_PENDING
      }
    });
    await this.logFundingEvent(topUp.id, {
      source: 'ISSUER',
      eventType: dto.eventType,
      fromState: topUp.fundingState,
      toState: TopUpFundingState.ISSUER_PENDING,
      message: 'Issuer acknowledged funding and is processing card load.',
      payload: dto
    });
    await this.logWebhook('issuer', dto.webhookId, dto.eventType, true);
    return { processed: true };
  }

  private async handleFundingLoaded(dto: IssuerWebhookDto) {
    if (!dto.funding?.topUpReference) {
      throw new BadRequestException('Funding data missing');
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
        status: TopUpStatus.COMPLETED,
        fundingState: TopUpFundingState.CARD_LOADED,
        issuerLoadedAt: dto.funding.timestamp ? new Date(dto.funding.timestamp) : new Date(),
        settlementFailureReason: null
      }
    });
    await this.logFundingEvent(topUp.id, {
      source: 'ISSUER',
      eventType: dto.eventType,
      fromState: topUp.fundingState,
      toState: TopUpFundingState.CARD_LOADED,
      message: 'Issuer confirmed card balance load completion.',
      payload: dto
    });
    await this.logWebhook('issuer', dto.webhookId, dto.eventType, true);
    return { processed: true };
  }

  private async handleFundingFailed(dto: IssuerWebhookDto) {
    if (!dto.funding?.topUpReference) {
      throw new BadRequestException('Funding data missing');
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
        status: TopUpStatus.FAILED,
        fundingState: TopUpFundingState.FAILED,
        settlementFailureReason: dto.funding.reason || 'Issuer reported card load failure'
      }
    });
    await this.logFundingEvent(topUp.id, {
      source: 'ISSUER',
      eventType: dto.eventType,
      fromState: topUp.fundingState,
      toState: TopUpFundingState.FAILED,
      message: dto.funding.reason || 'Issuer reported card load failure.',
      payload: dto
    });
    await this.logWebhook('issuer', dto.webhookId, dto.eventType, true);
    return { processed: true };
  }

  private async logFundingEvent(
    topUpId: string,
    event: {
      source: string;
      eventType: string;
      fromState: TopUpFundingState | null;
      toState: TopUpFundingState;
      message?: string;
      payload?: any;
    }
  ) {
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

  private async logWebhook(source: 'issuer' | 'psp' | 'chapa', webhookId: string, eventType: string, success: boolean) {
    try {
      await this.prisma.webhookLog.create({
        data: {
          webhookId,
          source,
          eventType,
          success
        }
      });
    } catch (error) {
      this.logger.warn(`Webhook log write failed: ${String((error as Error).message || error)}`);
    }
  }
}

