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
exports.CardsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
const card_service_1 = require("./card.service");
const merchant_lock_service_1 = require("./merchant-lock.service");
const create_card_dto_1 = require("./dto/create-card.dto");
const update_merchant_locks_dto_1 = require("./dto/update-merchant-locks.dto");
const update_time_window_dto_1 = require("./dto/update-time-window.dto");
const card_creation_rate_limit_guard_1 = require("./card-creation-rate-limit.guard");
let CardsController = class CardsController {
    constructor(cardsService, merchantLockService) {
        this.cardsService = cardsService;
        this.merchantLockService = merchantLockService;
    }
    create(req, dto) {
        return this.cardsService.create(req.user.userId, dto);
    }
    list(req) {
        return this.cardsService.listForUser(req.user.userId);
    }
    freeze(req, id) {
        return this.cardsService.freeze(id, req.user.userId);
    }
    unfreeze(req, id) {
        return this.cardsService.unfreeze(id, req.user.userId);
    }
    async updateMerchantLocks(req, id, dto) {
        // Verify user has access to the card
        await this.cardsService.getAccessibleCard(id, req.user.userId);
        return this.merchantLockService.updateMerchantLocks(id, dto);
    }
    getMccCategories() {
        return this.merchantLockService.getCommonMccCategories();
    }
    updateTimeWindow(req, id, dto) {
        return this.cardsService.updateTimeWindow(id, req.user.userId, dto);
    }
};
exports.CardsController = CardsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(card_creation_rate_limit_guard_1.CardCreationRateLimitGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_card_dto_1.CreateCardDto]),
    __metadata("design:returntype", void 0)
], CardsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CardsController.prototype, "list", null);
__decorate([
    (0, common_1.Patch)(':id/freeze'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CardsController.prototype, "freeze", null);
__decorate([
    (0, common_1.Patch)(':id/unfreeze'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CardsController.prototype, "unfreeze", null);
__decorate([
    (0, common_1.Patch)(':id/merchant-locks'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_merchant_locks_dto_1.UpdateMerchantLocksDto]),
    __metadata("design:returntype", Promise)
], CardsController.prototype, "updateMerchantLocks", null);
__decorate([
    (0, common_1.Get)('mcc-categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CardsController.prototype, "getMccCategories", null);
__decorate([
    (0, common_1.Patch)(':id/time-window'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_time_window_dto_1.UpdateTimeWindowDto]),
    __metadata("design:returntype", void 0)
], CardsController.prototype, "updateTimeWindow", null);
exports.CardsController = CardsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('cards'),
    __metadata("design:paramtypes", [card_service_1.CardsService,
        merchant_lock_service_1.MerchantLockService])
], CardsController);
//# sourceMappingURL=card.controller.js.map