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
exports.SubscriptionController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
const subscription_detection_service_1 = require("./subscription-detection.service");
const create_subscription_dto_1 = require("./dto/create-subscription.dto");
const update_subscription_dto_1 = require("./dto/update-subscription.dto");
const card_service_1 = require("../cards/card.service");
let SubscriptionController = class SubscriptionController {
    constructor(subscriptionService, cardsService) {
        this.subscriptionService = subscriptionService;
        this.cardsService = cardsService;
    }
    async list(req) {
        return this.subscriptionService.getSubscriptionsForUser(req.user.userId);
    }
    async listForCard(req, cardId) {
        // Verify user has access to card
        await this.cardsService.getAccessibleCard(cardId, req.user.userId);
        return this.subscriptionService.getSubscriptionsForCard(cardId);
    }
    async create(req, dto) {
        // Verify user has access to card
        await this.cardsService.getAccessibleCard(dto.cardId, req.user.userId);
        return this.subscriptionService.createSubscription(dto.cardId, dto.merchant, dto.amountHint, dto.nextExpectedCharge ? new Date(dto.nextExpectedCharge) : undefined);
    }
    async update(req, id, dto) {
        // Get subscription to verify access
        const subscription = await this.subscriptionService.getSubscriptionById(id);
        if (!subscription) {
            throw new common_1.NotFoundException('Subscription not found');
        }
        await this.cardsService.getAccessibleCard(subscription.cardId, req.user.userId);
        return this.subscriptionService.updateSubscription(id, {
            merchant: dto.merchant,
            amountHint: dto.amountHint,
            nextExpectedCharge: dto.nextExpectedCharge ? new Date(dto.nextExpectedCharge) : undefined,
            lastChargeAt: dto.lastChargeAt ? new Date(dto.lastChargeAt) : undefined
        });
    }
    async delete(req, id) {
        // Get subscription to verify access
        const subscription = await this.subscriptionService.getSubscriptionById(id);
        if (!subscription) {
            throw new common_1.NotFoundException('Subscription not found');
        }
        await this.cardsService.getAccessibleCard(subscription.cardId, req.user.userId);
        return this.subscriptionService.deleteSubscription(id);
    }
};
exports.SubscriptionController = SubscriptionController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('card/:cardId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('cardId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "listForCard", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_subscription_dto_1.CreateSubscriptionDto]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_subscription_dto_1.UpdateSubscriptionDto]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "delete", null);
exports.SubscriptionController = SubscriptionController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('subscriptions'),
    __metadata("design:paramtypes", [subscription_detection_service_1.SubscriptionDetectionService,
        card_service_1.CardsService])
], SubscriptionController);
//# sourceMappingURL=subscription.controller.js.map