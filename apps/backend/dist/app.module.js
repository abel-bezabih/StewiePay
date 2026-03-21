"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const prisma_module_1 = require("./prisma/prisma.module");
const user_module_1 = require("./users/user.module");
const auth_module_1 = require("./auth/auth.module");
const integrations_module_1 = require("./integrations/integrations.module");
const card_module_1 = require("./cards/card.module");
const transaction_module_1 = require("./transactions/transaction.module");
const topup_module_1 = require("./topups/topup.module");
const analytics_module_1 = require("./analytics/analytics.module");
const webhook_module_1 = require("./webhooks/webhook.module");
const notification_module_1 = require("./notifications/notification.module");
const subscription_module_1 = require("./subscriptions/subscription.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true
            }),
            prisma_module_1.PrismaModule,
            user_module_1.UsersModule,
            auth_module_1.AuthModule,
            integrations_module_1.IntegrationsModule,
            card_module_1.CardsModule,
            transaction_module_1.TransactionsModule,
            topup_module_1.TopUpModule,
            subscription_module_1.SubscriptionsModule,
            analytics_module_1.AnalyticsModule,
            webhook_module_1.WebhookModule,
            notification_module_1.NotificationsModule
        ],
        controllers: [app_controller_1.AppController]
    })
], AppModule);
//# sourceMappingURL=app.module.js.map