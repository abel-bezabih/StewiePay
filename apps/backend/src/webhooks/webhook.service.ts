import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IssuerWebhookDto, IssuerWebhookEventType } from './dto/issuer-webhook.dto';
import { PspWebhookDto, PspWebhookEventType } from './dto/psp-webhook.dto';
import { TransactionStatus, TopUpStatus } from '@prisma/client';
import { NotificationService } from '../notifications/notification.service';
import { SubscriptionDetectionService } from '../subscriptions/subscription-detection.service';
import { TransactionCategoryService } from '../transactions/transaction-category.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private subscriptionDetection: SubscriptionDetectionService,
    private categoryService: TransactionCategoryService
  ) {}

  /**
   * Verify webhook signature (implement based on your issuer/PSP requirements)
   */
  private verifySignature(payload: any, signature: string | undefined, secret: string): boolean {
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
  async processIssuerWebhook(dto: IssuerWebhookDto) {
    this.logger.log(`Processing issuer webhook: ${dto.eventType} (${dto.webhookId})`);

    // Verify signature (if provided)
    const webhookSecret = process.env.ISSUER_WEBHOOK_SECRET || 'dev-secret';
    if (!this.verifySignature(dto, dto.signature, webhookSecret)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // Check for duplicate webhook (idempotency)
    const existingWebhook = await this.prisma.$queryRaw`
      SELECT id FROM "WebhookLog" WHERE "webhookId" = ${dto.webhookId} AND "source" = 'issuer'
    `.catch(() => null);

    if (existingWebhook) {
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
    const webhookSecret = process.env.PSP_WEBHOOK_SECRET || 'dev-secret';
    if (!this.verifySignature(dto, dto.signature, webhookSecret)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // Check for duplicate
    const existingWebhook = await this.prisma.$queryRaw`
      SELECT id FROM "WebhookLog" WHERE "webhookId" = ${dto.webhookId} AND "source" = 'psp'
    `.catch(() => null);

    if (existingWebhook) {
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
      data: { status: TransactionStatus.SETTLED }
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
        .catch((err: any) => this.logger.error('Subscription detection failed:', err));
    }

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

  private async handleCardUnfrozen(dto: IssuerWebhookDto) {
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

  private async handleCardClosed(dto: IssuerWebhookDto) {
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
        data: { status: TopUpStatus.PENDING }
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
        data: { status: TopUpStatus.COMPLETED }
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
        data: { status: TopUpStatus.FAILED }
      });
    }

    await this.logWebhook('psp', dto.webhookId, dto.eventType, true);
    return { processed: true };
  }

  private async logWebhook(source: 'issuer' | 'psp', webhookId: string, eventType: string, success: boolean) {
    // Note: This assumes a WebhookLog table exists. If not, we can skip logging or create the table.
    // For now, we'll just log to console
    this.logger.log(`Webhook logged: ${source} - ${webhookId} - ${eventType} - ${success ? 'success' : 'failed'}`);
  }
}

