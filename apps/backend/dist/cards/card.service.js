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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const issuer_adapter_1 = require("../integrations/issuer/issuer.adapter");
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
    }
    /**
     * Verify user account is in good standing
     */
    async verifyUserAccount(userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.usersService.assertPaymentKycEligible(userId, 'create a card');
        return user;
    }
    /**
     * Check if user has reached card creation limit
     */
    async checkCardCreationLimit(userId) {
        const userCardCount = await this.prisma.card.count({
            where: { ownerUserId: userId, status: { not: client_1.CardStatus.CLOSED } }
        });
        if (userCardCount >= this.MAX_CARDS_PER_USER) {
            throw new common_1.ForbiddenException(`You have reached the maximum card limit of ${this.MAX_CARDS_PER_USER}`);
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
    validateLimitsUpdate(dto) {
        if (dto.limitDaily !== undefined && dto.limitDaily !== null && dto.limitDaily < 0) {
            throw new common_1.BadRequestException('Daily limit must be positive');
        }
        if (dto.limitMonthly !== undefined && dto.limitMonthly !== null && dto.limitMonthly < 0) {
            throw new common_1.BadRequestException('Monthly limit must be positive');
        }
        if (dto.limitPerTxn !== undefined && dto.limitPerTxn !== null && dto.limitPerTxn < 0) {
            throw new common_1.BadRequestException('Per-transaction limit must be positive');
        }
        const daily = dto.limitDaily ?? undefined;
        const monthly = dto.limitMonthly ?? undefined;
        const perTxn = dto.limitPerTxn ?? undefined;
        if (daily && monthly && daily > monthly) {
            throw new common_1.BadRequestException('Daily limit cannot exceed monthly limit');
        }
        if (perTxn && daily && perTxn > daily) {
            throw new common_1.BadRequestException('Per-transaction limit cannot exceed daily limit');
        }
    }
    /**
     * Create a new card with full authentication and authorization checks
     */
    async create(userId, dto) {
        // 1. Verify user account is valid
        await this.verifyUserAccount(userId);
        // 2. Validate card limits
        this.validateCardLimits(dto);
        // 3. Cards are owned by the user in V1
        const ownerUserId = userId;
        // 4. Check card creation limits
        await this.checkCardCreationLimit(userId);
        // 5. Validate card type
        const type = dto.type ?? client_1.CardType.PERMANENT;
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
        }
        catch (error) {
            // If database save fails, we should ideally rollback the issuer card
            // For now, log the error
            console.error('Failed to save card after issuer creation:', error);
            throw new common_1.BadRequestException('Failed to create card. Please try again.');
        }
    }
    async listForUser(userId) {
        return this.prisma.card.findMany({
            where: {
                ownerUserId: userId
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
        throw new common_1.UnauthorizedException('No access to this card');
    }
    async getAccessibleCardIds(userId) {
        const cards = await this.prisma.card.findMany({
            where: {
                ownerUserId: userId
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
        if (card.ownerUserId) {
            this.notificationService
                .notifyCardStatusChange(card.ownerUserId, cardId, 'FROZEN')
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
        if (card.ownerUserId) {
            this.notificationService
                .notifyCardStatusChange(card.ownerUserId, cardId, 'ACTIVE')
                .catch((err) => console.error('Notification failed:', err));
        }
        return updated;
    }
    async updateLimits(cardId, userId, dto) {
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
    __param(1, (0, common_1.Inject)(issuer_adapter_1.ISSUER_ADAPTER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object, user_service_1.UsersService,
        time_window_service_1.TimeWindowService,
        notification_service_1.NotificationService])
], CardsService);
//# sourceMappingURL=card.service.js.map