"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardsModule = void 0;
const common_1 = require("@nestjs/common");
const card_service_1 = require("./card.service");
const card_controller_1 = require("./card.controller");
const card_creation_rate_limit_guard_1 = require("./card-creation-rate-limit.guard");
const merchant_lock_service_1 = require("./merchant-lock.service");
const time_window_service_1 = require("./time-window.service");
const prisma_module_1 = require("../prisma/prisma.module");
const integrations_module_1 = require("../integrations/integrations.module");
const user_module_1 = require("../users/user.module");
const notification_module_1 = require("../notifications/notification.module");
let CardsModule = class CardsModule {
};
exports.CardsModule = CardsModule;
exports.CardsModule = CardsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, integrations_module_1.IntegrationsModule, user_module_1.UsersModule, notification_module_1.NotificationsModule],
        controllers: [card_controller_1.CardsController],
        providers: [card_service_1.CardsService, card_creation_rate_limit_guard_1.CardCreationRateLimitGuard, merchant_lock_service_1.MerchantLockService, time_window_service_1.TimeWindowService],
        exports: [card_service_1.CardsService, merchant_lock_service_1.MerchantLockService, time_window_service_1.TimeWindowService]
    })
], CardsModule);
//# sourceMappingURL=card.module.js.map