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
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const card_service_1 = require("../cards/card.service");
let SubscriptionsService = class SubscriptionsService {
    constructor(prisma, cardsService) {
        this.prisma = prisma;
        this.cardsService = cardsService;
    }
    async create(userId, dto) {
        await this.cardsService.getAccessibleCard(dto.cardId, userId);
        return this.prisma.subscription.create({
            data: {
                cardId: dto.cardId,
                merchant: dto.merchant.trim(),
                amountHint: dto.amountHint,
                currency: dto.currency?.trim() || 'ETB',
                nextExpectedCharge: dto.nextExpectedCharge ? new Date(dto.nextExpectedCharge) : null
            }
        });
    }
    async list(userId, options) {
        if (options?.cardId) {
            await this.cardsService.getAccessibleCard(options.cardId, userId);
            return this.prisma.subscription.findMany({
                where: { cardId: options.cardId },
                orderBy: [{ nextExpectedCharge: 'asc' }, { id: 'desc' }]
            });
        }
        const cardIds = await this.cardsService.getAccessibleCardIds(userId);
        if (!cardIds.length)
            return [];
        return this.prisma.subscription.findMany({
            where: { cardId: { in: cardIds } },
            orderBy: [{ nextExpectedCharge: 'asc' }, { id: 'desc' }]
        });
    }
    async update(userId, subscriptionId, dto) {
        const existing = await this.prisma.subscription.findUnique({
            where: { id: subscriptionId }
        });
        if (!existing) {
            throw new common_1.NotFoundException('Subscription not found');
        }
        await this.cardsService.getAccessibleCard(existing.cardId, userId);
        return this.prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                merchant: dto.merchant?.trim(),
                amountHint: dto.amountHint,
                currency: dto.currency?.trim(),
                nextExpectedCharge: dto.nextExpectedCharge === null
                    ? null
                    : dto.nextExpectedCharge
                        ? new Date(dto.nextExpectedCharge)
                        : undefined,
                lastChargeAt: dto.lastChargeAt === null
                    ? null
                    : dto.lastChargeAt
                        ? new Date(dto.lastChargeAt)
                        : undefined
            }
        });
    }
    async remove(userId, subscriptionId) {
        const existing = await this.prisma.subscription.findUnique({
            where: { id: subscriptionId }
        });
        if (!existing) {
            throw new common_1.NotFoundException('Subscription not found');
        }
        await this.cardsService.getAccessibleCard(existing.cardId, userId);
        await this.prisma.subscription.delete({ where: { id: subscriptionId } });
        return { deleted: true };
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        card_service_1.CardsService])
], SubscriptionsService);
//# sourceMappingURL=subscription.service.js.map