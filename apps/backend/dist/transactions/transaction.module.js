"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsModule = void 0;
const common_1 = require("@nestjs/common");
const transaction_service_1 = require("./transaction.service");
const transaction_controller_1 = require("./transaction.controller");
const transaction_category_service_1 = require("./transaction-category.service");
const prisma_module_1 = require("../prisma/prisma.module");
const card_module_1 = require("../cards/card.module");
const notification_module_1 = require("../notifications/notification.module");
const user_module_1 = require("../users/user.module");
let TransactionsModule = class TransactionsModule {
};
exports.TransactionsModule = TransactionsModule;
exports.TransactionsModule = TransactionsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, card_module_1.CardsModule, notification_module_1.NotificationsModule, user_module_1.UsersModule],
        controllers: [transaction_controller_1.TransactionsController],
        providers: [transaction_service_1.TransactionsService, transaction_category_service_1.TransactionCategoryService],
        exports: [transaction_service_1.TransactionsService, transaction_category_service_1.TransactionCategoryService]
    })
], TransactionsModule);
// TimeWindowService is imported via CardsModule
//# sourceMappingURL=transaction.module.js.map