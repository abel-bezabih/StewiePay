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
exports.CardsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const dummy_issuer_adapter_1 = require("../integrations/issuer/dummy-issuer.adapter");
const user_service_1 = require("../users/user.service");
const time_window_service_1 = require("./time-window.service");
const notification_service_1 = require("../notifications/notification.service");
let CardsService = class CardsService {
    constructor(prisma, issuer, usersService, timeWindowService, notificationService) {
        this.prisma = prisma;
        this.issuer = issuer;
        this.usersService = usersService;
        this.timeWindowService = timeWindowService;
        this.notificationService = notificationService;
        // Maximum cards per user (can be made configurable)
        this.MAX_CARDS_PER_USER = 50;
        this.MAX_CARDS_PER_ORG = 100;
    }
    /**
     * Verify user account is in good standing
     */
    async verifyUserAccount(userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
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
    async checkCardCreationLimit(userId, orgId) {
        if (orgId) {
            const orgCardCount = await this.prisma.card.count({
                where: { ownerOrgId: orgId, status: { not: client_1.CardStatus.CLOSED } }
            });
            if (orgCardCount >= this.MAX_CARDS_PER_ORG) {
                throw new common_1.ForbiddenException(`Organization has reached the maximum card limit of ${this.MAX_CARDS_PER_ORG}`);
            }
        }
        else {
            const userCardCount = await this.prisma.card.count({
                where: { ownerUserId: userId, status: { not: client_1.CardStatus.CLOSED } }
            });
            if (userCardCount >= this.MAX_CARDS_PER_USER) {
                throw new common_1.ForbiddenException(`You have reached the maximum card limit of ${this.MAX_CARDS_PER_USER}`);
            }
        }
    }
    /**
     * Validate card limits are reasonable
     */
    validateCardLimits(dto) {
        if (dto.limitDaily && dto.limitDaily < 0) {
            throw new common_1.BadRequestException('Daily limit must be positive');
        }
        if (dto.limitMonthly && dto.limitMonthly < 0) {
            throw new common_1.BadRequestException('Monthly limit must be positive');
        }
        if (dto.limitPerTxn && dto.limitPerTxn < 0) {
            throw new common_1.BadRequestException('Per-transaction limit must be positive');
        }
        // Ensure monthly >= daily (if both set)
        if (dto.limitDaily && dto.limitMonthly && dto.limitDaily > dto.limitMonthly) {
            throw new common_1.BadRequestException('Daily limit cannot exceed monthly limit');
        }
        // Ensure per-transaction <= daily (if both set)
        if (dto.limitPerTxn && dto.limitDaily && dto.limitPerTxn > dto.limitDaily) {
            throw new common_1.BadRequestException('Per-transaction limit cannot exceed daily limit');
        }
    }
    /**
     * Assert user has access to organization
     */
    async assertOrgAccess(userId, orgId) {
        const org = await this.prisma.organization.findUnique({
            where: { id: orgId },
            include: {
                members: { where: { userId } }
            }
        });
        if (!org)
            throw new common_1.NotFoundException('Organization not found');
        const isOwner = org.ownerId === userId;
        const isAdmin = org.members.some((m) => m.role === client_1.OrgRole.ADMIN);
        const isMember = org.members.some((m) => m.role === client_1.OrgRole.MEMBER);
        if (!(isOwner || isAdmin || isMember)) {
            throw new common_1.UnauthorizedException('Not a member of this organization');
        }
        // Only owners and admins can create cards for orgs
        if (!(isOwner || isAdmin)) {
            throw new common_1.ForbiddenException('Only organization owners and admins can create cards');
        }
        return { org, isOwnerOrAdmin: isOwner || isAdmin };
    }
    /**
     * Create a new card with full authentication and authorization checks
     */
    async create(userId, dto) {
        // 1. Verify user account is valid
        await this.verifyUserAccount(userId);
        // 2. Validate card limits
        this.validateCardLimits(dto);
        // 3. Check organization access if orgId provided
        let ownerUserId;
        let ownerOrgId;
        if (dto.orgId) {
            await this.assertOrgAccess(userId, dto.orgId);
            ownerOrgId = dto.orgId;
        }
        else {
            ownerUserId = userId;
        }
        // 4. Check card creation limits
        await this.checkCardCreationLimit(userId, dto.orgId);
        // 5. Validate card type
        const type = dto.type ?? client_1.CardType.PERMANENT;
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
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to issue card: ${error.message || 'Unknown error'}`);
        }
        // 7. Create card in database
        try {
            const card = await this.prisma.card.create({
                data: {
                    issuerCardId: issuerCard.issuerCardId,
                    status: issuerCard.status,
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
        }
        catch (error) {
            // If database save fails, we should ideally rollback the issuer card
            // For now, log the error
            console.error('Failed to save card after issuer creation:', error);
            throw new common_1.BadRequestException('Failed to create card. Please try again.');
        }
    }
    async listForUser(userId) {
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
    async getAccessibleCard(cardId, userId) {
        const card = await this.prisma.card.findUnique({ where: { id: cardId } });
        if (!card)
            throw new common_1.NotFoundException('Card not found');
        if (card.ownerUserId === userId)
            return card;
        if (card.ownerOrgId) {
            const membership = await this.prisma.organizationMember.findFirst({
                where: { organizationId: card.ownerOrgId, userId }
            });
            if (membership || (await this.prisma.organization.findFirst({ where: { id: card.ownerOrgId, ownerId: userId } }))) {
                return card;
            }
        }
        throw new common_1.UnauthorizedException('No access to this card');
    }
    async getAccessibleCardIds(userId) {
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
    async freeze(cardId, userId) {
        const card = await this.getAccessibleCard(cardId, userId);
        await this.issuer.freezeCard(card.issuerCardId);
        const updated = await this.prisma.card.update({
            where: { id: card.id },
            data: { status: client_1.CardStatus.FROZEN }
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
    async unfreeze(cardId, userId) {
        const card = await this.getAccessibleCard(cardId, userId);
        await this.issuer.unfreezeCard(card.issuerCardId);
        const updated = await this.prisma.card.update({
            where: { id: card.id },
            data: { status: client_1.CardStatus.ACTIVE }
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
    async updateTimeWindow(cardId, userId, dto) {
        const card = await this.getAccessibleCard(cardId, userId);
        // Validate time window configuration
        this.timeWindowService.validateTimeWindow(dto);
        // Build update data
        const updateData = {};
        if (dto.enabled !== undefined) {
            updateData.timeWindowEnabled = dto.enabled;
        }
        if (dto.enabled !== false) {
            // Only update config if enabled is true or not provided
            const config = {};
            if (dto.daysOfWeek !== undefined)
                config.daysOfWeek = dto.daysOfWeek;
            if (dto.startTime !== undefined)
                config.startTime = dto.startTime;
            if (dto.endTime !== undefined)
                config.endTime = dto.endTime;
            if (dto.timezone !== undefined)
                config.timezone = dto.timezone;
            // If we have any config, merge with existing or create new
            if (Object.keys(config).length > 0) {
                const existingConfig = card.timeWindowConfig
                    ? JSON.parse(card.timeWindowConfig)
                    : {};
                updateData.timeWindowConfig = JSON.stringify({ ...existingConfig, ...config });
            }
        }
        else {
            // If disabling, clear config
            updateData.timeWindowConfig = null;
        }
        return this.prisma.card.update({
            where: { id: card.id },
            data: updateData
        });
    }
};
exports.CardsService = CardsService;
exports.CardsService = CardsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        dummy_issuer_adapter_1.DummyIssuerAdapter,
        user_service_1.UsersService,
        time_window_service_1.TimeWindowService,
        notification_service_1.NotificationService])
], CardsService);
//# sourceMappingURL=card.service.js.map