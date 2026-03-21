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
exports.TransactionsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
const transaction_service_1 = require("./transaction.service");
const transaction_category_service_1 = require("./transaction-category.service");
const create_transaction_dto_1 = require("./dto/create-transaction.dto");
const list_transactions_dto_1 = require("./dto/list-transactions.dto");
let TransactionsController = class TransactionsController {
    constructor(txService, categoryService) {
        this.txService = txService;
        this.categoryService = categoryService;
    }
    simulate(req, dto) {
        return this.txService.simulate(req.user.userId, dto);
    }
    list(req, query) {
        return this.txService.list(req.user.userId, {
            cardId: query.cardId,
            merchantName: query.merchantName,
            category: query.category,
            startDate: query.startDate,
            endDate: query.endDate,
            minAmount: query.minAmount,
            maxAmount: query.maxAmount,
            search: query.search,
            status: query.status
        });
    }
    getCategories() {
        const categories = this.categoryService.getCategories();
        return categories.map((cat) => ({
            name: cat,
            icon: this.categoryService.getCategoryIcon(cat),
            color: this.categoryService.getCategoryColor(cat)
        }));
    }
};
exports.TransactionsController = TransactionsController;
__decorate([
    (0, common_1.Post)('simulate'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_transaction_dto_1.CreateTransactionDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "simulate", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_transactions_dto_1.ListTransactionsDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "getCategories", null);
exports.TransactionsController = TransactionsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('transactions'),
    __metadata("design:paramtypes", [transaction_service_1.TransactionsService,
        transaction_category_service_1.TransactionCategoryService])
], TransactionsController);
//# sourceMappingURL=transaction.controller.js.map