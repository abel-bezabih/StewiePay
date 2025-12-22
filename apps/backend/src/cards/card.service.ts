import { BadRequestException, Injectable, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { CardStatus, CardType, OrgRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';
import { DummyIssuerAdapter } from '../integrations/issuer/dummy-issuer.adapter';
import { UsersService } from '../users/user.service';
import { TimeWindowService } from './time-window.service';
import { UpdateTimeWindowDto } from './dto/update-time-window.dto';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class CardsService {
  // Maximum cards per user (can be made configurable)
  private readonly MAX_CARDS_PER_USER = 50;
  private readonly MAX_CARDS_PER_ORG = 100;

  constructor(
    private prisma: PrismaService,
    private issuer: DummyIssuerAdapter,
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
    // Add future checks here:
    // - Email verification status
    // - Account suspension
    // - KYC completion
    // - Payment method on file
    return user;
  }

  /**
   * Check if user has reached card creation limit
   */
  private async checkCardCreationLimit(userId: string, orgId?: string) {
    if (orgId) {
      const orgCardCount = await this.prisma.card.count({
        where: { ownerOrgId: orgId, status: { not: CardStatus.CLOSED } }
      });
      if (orgCardCount >= this.MAX_CARDS_PER_ORG) {
        throw new ForbiddenException(
          `Organization has reached the maximum card limit of ${this.MAX_CARDS_PER_ORG}`
        );
      }
    } else {
      const userCardCount = await this.prisma.card.count({
        where: { ownerUserId: userId, status: { not: CardStatus.CLOSED } }
      });
      if (userCardCount >= this.MAX_CARDS_PER_USER) {
        throw new ForbiddenException(
          `You have reached the maximum card limit of ${this.MAX_CARDS_PER_USER}`
        );
      }
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

  /**
   * Assert user has access to organization
   */
  private async assertOrgAccess(userId: string, orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        members: { where: { userId } }
      }
    });
    if (!org) throw new NotFoundException('Organization not found');
    
    const isOwner = org.ownerId === userId;
    const isAdmin = org.members.some((m) => m.role === OrgRole.ADMIN);
    const isMember = org.members.some((m) => m.role === OrgRole.MEMBER);
    
    if (!(isOwner || isAdmin || isMember)) {
      throw new UnauthorizedException('Not a member of this organization');
    }
    
    // Only owners and admins can create cards for orgs
    if (!(isOwner || isAdmin)) {
      throw new ForbiddenException('Only organization owners and admins can create cards');
    }
    
    return { org, isOwnerOrAdmin: isOwner || isAdmin };
  }

  /**
   * Create a new card with full authentication and authorization checks
   */
  async create(userId: string, dto: CreateCardDto) {
    // 1. Verify user account is valid
    await this.verifyUserAccount(userId);

    // 2. Validate card limits
    this.validateCardLimits(dto);

    // 3. Check organization access if orgId provided
    let ownerUserId: string | undefined;
    let ownerOrgId: string | undefined;

    if (dto.orgId) {
      await this.assertOrgAccess(userId, dto.orgId);
      ownerOrgId = dto.orgId;
    } else {
      ownerUserId = userId;
    }

    // 4. Check card creation limits
    await this.checkCardCreationLimit(userId, dto.orgId);

    // 5. Validate card type
    const type = dto.type ?? CardType.PERMANENT;
    const currency = dto.currency ?? 'ETB';

    // 6. Issue card from issuer
    let issuerCard;
    try {
      issuerCard = await this.issuer.issueCard({
        ownerReference: dto.orgId ?? userId,
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
          ownerUserId,
          ownerOrgId
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
    const orgMemberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      select: { organizationId: true }
    });
    const orgIds = orgMemberships.map((m) => m.organizationId);

    return this.prisma.card.findMany({
      where: {
        OR: [{ ownerUserId: userId }, ...(orgIds.length ? [{ ownerOrgId: { in: orgIds } }] : [])]
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAccessibleCard(cardId: string, userId: string) {
    const card = await this.prisma.card.findUnique({ where: { id: cardId } });
    if (!card) throw new NotFoundException('Card not found');

    if (card.ownerUserId === userId) return card;
    if (card.ownerOrgId) {
      const membership = await this.prisma.organizationMember.findFirst({
        where: { organizationId: card.ownerOrgId, userId }
      });
      if (membership || (await this.prisma.organization.findFirst({ where: { id: card.ownerOrgId, ownerId: userId } }))) {
        return card;
      }
    }
    throw new UnauthorizedException('No access to this card');
  }

  async getAccessibleCardIds(userId: string) {
    const cards = await this.prisma.card.findMany({
      where: {
        OR: [
          { ownerUserId: userId },
          {
            ownerOrg: {
              OR: [
                { ownerId: userId },
                { members: { some: { userId } } }
              ]
            }
          }
        ]
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
    const ownerUserId = card.ownerUserId || (card.ownerOrgId
      ? (await this.prisma.organization.findUnique({ where: { id: card.ownerOrgId }, select: { ownerId: true } }))?.ownerId
      : null);
    if (ownerUserId) {
      this.notificationService
        .notifyCardStatusChange(ownerUserId, cardId, 'FROZEN')
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
    const ownerUserId = card.ownerUserId || (card.ownerOrgId
      ? (await this.prisma.organization.findUnique({ where: { id: card.ownerOrgId }, select: { ownerId: true } }))?.ownerId
      : null);
    if (ownerUserId) {
      this.notificationService
        .notifyCardStatusChange(ownerUserId, cardId, 'ACTIVE')
        .catch((err) => console.error('Notification failed:', err));
    }

    return updated;
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
