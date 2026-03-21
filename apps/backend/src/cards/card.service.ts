import { BadRequestException, Injectable, NotFoundException, UnauthorizedException, ForbiddenException, Inject } from '@nestjs/common';
import { CardStatus, CardType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';
import { ISSUER_ADAPTER, IssuerAdapter } from '../integrations/issuer/issuer.adapter';
import { UsersService } from '../users/user.service';
import { TimeWindowService } from './time-window.service';
import { UpdateTimeWindowDto } from './dto/update-time-window.dto';
import { NotificationService } from '../notifications/notification.service';
import { UpdateCardLimitsDto } from './dto/update-card-limits.dto';

@Injectable()
export class CardsService {
  // Maximum cards per user (can be made configurable)
  private readonly MAX_CARDS_PER_USER = 50;

  constructor(
    private prisma: PrismaService,
    @Inject(ISSUER_ADAPTER) private issuer: IssuerAdapter,
    private usersService: UsersService,
    private timeWindowService: TimeWindowService,
    private notificationService: NotificationService
  ) {}

  /**
   * Verify user account is in good standing
   */
  private async verifyUserAccount(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersService.assertPaymentKycEligible(userId, 'create a card');
    return user;
  }

  /**
   * Check if user has reached card creation limit
   */
  private async checkCardCreationLimit(userId: string) {
    const userCardCount = await this.prisma.card.count({
      where: { ownerUserId: userId, status: { not: CardStatus.CLOSED } }
    });
    if (userCardCount >= this.MAX_CARDS_PER_USER) {
      throw new ForbiddenException(
        `You have reached the maximum card limit of ${this.MAX_CARDS_PER_USER}`
      );
    }
  }

  /**
   * Validate card limits are reasonable
   */
  private validateCardLimits(dto: CreateCardDto) {
    if (dto.limitDaily && dto.limitDaily < 0) {
      throw new BadRequestException('Daily limit must be positive');
    }
    if (dto.limitMonthly && dto.limitMonthly < 0) {
      throw new BadRequestException('Monthly limit must be positive');
    }
    if (dto.limitPerTxn && dto.limitPerTxn < 0) {
      throw new BadRequestException('Per-transaction limit must be positive');
    }

    // Ensure monthly >= daily (if both set)
    if (dto.limitDaily && dto.limitMonthly && dto.limitDaily > dto.limitMonthly) {
      throw new BadRequestException('Daily limit cannot exceed monthly limit');
    }

    // Ensure per-transaction <= daily (if both set)
    if (dto.limitPerTxn && dto.limitDaily && dto.limitPerTxn > dto.limitDaily) {
      throw new BadRequestException('Per-transaction limit cannot exceed daily limit');
    }
  }

  private validateLimitsUpdate(dto: UpdateCardLimitsDto) {
    if (dto.limitDaily !== undefined && dto.limitDaily !== null && dto.limitDaily < 0) {
      throw new BadRequestException('Daily limit must be positive');
    }
    if (dto.limitMonthly !== undefined && dto.limitMonthly !== null && dto.limitMonthly < 0) {
      throw new BadRequestException('Monthly limit must be positive');
    }
    if (dto.limitPerTxn !== undefined && dto.limitPerTxn !== null && dto.limitPerTxn < 0) {
      throw new BadRequestException('Per-transaction limit must be positive');
    }

    const daily = dto.limitDaily ?? undefined;
    const monthly = dto.limitMonthly ?? undefined;
    const perTxn = dto.limitPerTxn ?? undefined;

    if (daily && monthly && daily > monthly) {
      throw new BadRequestException('Daily limit cannot exceed monthly limit');
    }
    if (perTxn && daily && perTxn > daily) {
      throw new BadRequestException('Per-transaction limit cannot exceed daily limit');
    }
  }

  /**
   * Create a new card with full authentication and authorization checks
   */
  async create(userId: string, dto: CreateCardDto) {
    // 1. Verify user account is valid
    await this.verifyUserAccount(userId);

    // 2. Validate card limits
    this.validateCardLimits(dto);

    // 3. Cards are owned by the user in V1
    const ownerUserId = userId;

    // 4. Check card creation limits
    await this.checkCardCreationLimit(userId);

    // 5. Validate card type
    const type = dto.type ?? CardType.PERMANENT;
    const currency = dto.currency ?? 'ETB';

    // 6. Issue card from issuer
    let issuerCard;
    try {
      issuerCard = await this.issuer.issueCard({
        ownerReference: userId,
        type,
        limitDaily: dto.limitDaily,
        limitMonthly: dto.limitMonthly,
        limitPerTxn: dto.limitPerTxn,
        currency
      });
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to issue card: ${error.message || 'Unknown error'}`
      );
    }

    // 7. Create card in database
    try {
      const card = await this.prisma.card.create({
        data: {
          issuerCardId: issuerCard.issuerCardId,
          status: issuerCard.status as CardStatus,
          type,
          limitDaily: dto.limitDaily,
          limitMonthly: dto.limitMonthly,
          limitPerTxn: dto.limitPerTxn,
          currency,
          ownerUserId
        }
      });

      // TODO: Log card creation event for audit trail
      // await this.auditLogService.log({
      //   userId,
      //   action: 'CARD_CREATED',
      //   resourceId: card.id,
      //   metadata: { type, orgId: dto.orgId }
      // });

      return card;
    } catch (error: any) {
      // If database save fails, we should ideally rollback the issuer card
      // For now, log the error
      console.error('Failed to save card after issuer creation:', error);
      throw new BadRequestException('Failed to create card. Please try again.');
    }
  }

  async listForUser(userId: string) {
    return this.prisma.card.findMany({
      where: {
        ownerUserId: userId
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAccessibleCard(cardId: string, userId: string) {
    const card = await this.prisma.card.findUnique({ where: { id: cardId } });
    if (!card) throw new NotFoundException('Card not found');

    if (card.ownerUserId === userId) return card;
    throw new UnauthorizedException('No access to this card');
  }

  async getAccessibleCardIds(userId: string) {
    const cards = await this.prisma.card.findMany({
      where: {
        ownerUserId: userId
      },
      select: { id: true }
    });
    return cards.map((c) => c.id);
  }

  async freeze(cardId: string, userId: string) {
    const card = await this.getAccessibleCard(cardId, userId);
    await this.issuer.freezeCard(card.issuerCardId);
    const updated = await this.prisma.card.update({
      where: { id: card.id },
      data: { status: CardStatus.FROZEN }
    });

    // Send notification
    if (card.ownerUserId) {
      this.notificationService
        .notifyCardStatusChange(card.ownerUserId, cardId, 'FROZEN')
        .catch((err) => console.error('Notification failed:', err));
    }

    return updated;
  }

  async unfreeze(cardId: string, userId: string) {
    const card = await this.getAccessibleCard(cardId, userId);
    await this.issuer.unfreezeCard(card.issuerCardId);
    const updated = await this.prisma.card.update({
      where: { id: card.id },
      data: { status: CardStatus.ACTIVE }
    });

    // Send notification
    if (card.ownerUserId) {
      this.notificationService
        .notifyCardStatusChange(card.ownerUserId, cardId, 'ACTIVE')
        .catch((err) => console.error('Notification failed:', err));
    }

    return updated;
  }

  async updateLimits(cardId: string, userId: string, dto: UpdateCardLimitsDto) {
    const card = await this.getAccessibleCard(cardId, userId);
    this.validateLimitsUpdate(dto);

    return this.prisma.card.update({
      where: { id: card.id },
      data: {
        limitDaily: dto.limitDaily === null ? null : dto.limitDaily ?? card.limitDaily,
        limitMonthly: dto.limitMonthly === null ? null : dto.limitMonthly ?? card.limitMonthly,
        limitPerTxn: dto.limitPerTxn === null ? null : dto.limitPerTxn ?? card.limitPerTxn
      }
    });
  }

  async updateTimeWindow(cardId: string, userId: string, dto: UpdateTimeWindowDto) {
    const card = await this.getAccessibleCard(cardId, userId);

    // Validate time window configuration
    this.timeWindowService.validateTimeWindow(dto);

    // Build update data
    const updateData: any = {};

    if (dto.enabled !== undefined) {
      updateData.timeWindowEnabled = dto.enabled;
    }

    if (dto.enabled !== false) {
      // Only update config if enabled is true or not provided
      const config: any = {};
      if (dto.daysOfWeek !== undefined) config.daysOfWeek = dto.daysOfWeek;
      if (dto.startTime !== undefined) config.startTime = dto.startTime;
      if (dto.endTime !== undefined) config.endTime = dto.endTime;
      if (dto.timezone !== undefined) config.timezone = dto.timezone;

      // If we have any config, merge with existing or create new
      if (Object.keys(config).length > 0) {
        const existingConfig = card.timeWindowConfig
          ? JSON.parse(card.timeWindowConfig)
          : {};
        updateData.timeWindowConfig = JSON.stringify({ ...existingConfig, ...config });
      }
    } else {
      // If disabling, clear config
      updateData.timeWindowConfig = null;
    }

    return this.prisma.card.update({
      where: { id: card.id },
      data: updateData
    });
  }
}
