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
exports.IssuerWebhookDto = exports.FundingWebhookData = exports.CardWebhookData = exports.TransactionWebhookData = exports.IssuerWebhookEventType = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var IssuerWebhookEventType;
(function (IssuerWebhookEventType) {
    IssuerWebhookEventType["TRANSACTION_AUTHORIZED"] = "transaction.authorized";
    IssuerWebhookEventType["TRANSACTION_SETTLED"] = "transaction.settled";
    IssuerWebhookEventType["TRANSACTION_DECLINED"] = "transaction.declined";
    IssuerWebhookEventType["CARD_FROZEN"] = "card.frozen";
    IssuerWebhookEventType["CARD_UNFROZEN"] = "card.unfrozen";
    IssuerWebhookEventType["CARD_CLOSED"] = "card.closed";
    IssuerWebhookEventType["CARD_LIMIT_UPDATED"] = "card.limit_updated";
    IssuerWebhookEventType["FUNDING_LOADED"] = "funding.loaded";
    IssuerWebhookEventType["FUNDING_FAILED"] = "funding.failed";
    IssuerWebhookEventType["FUNDING_PENDING"] = "funding.pending";
})(IssuerWebhookEventType || (exports.IssuerWebhookEventType = IssuerWebhookEventType = {}));
class TransactionWebhookData {
}
exports.TransactionWebhookData = TransactionWebhookData;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransactionWebhookData.prototype, "transactionId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransactionWebhookData.prototype, "cardId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TransactionWebhookData.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransactionWebhookData.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransactionWebhookData.prototype, "merchantName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransactionWebhookData.prototype, "mcc", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransactionWebhookData.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], TransactionWebhookData.prototype, "timestamp", void 0);
class CardWebhookData {
}
exports.CardWebhookData = CardWebhookData;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CardWebhookData.prototype, "cardId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CardWebhookData.prototype, "limitDaily", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CardWebhookData.prototype, "limitMonthly", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CardWebhookData.prototype, "limitPerTxn", void 0);
class FundingWebhookData {
}
exports.FundingWebhookData = FundingWebhookData;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FundingWebhookData.prototype, "topUpReference", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FundingWebhookData.prototype, "providerReference", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FundingWebhookData.prototype, "issuerReference", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FundingWebhookData.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], FundingWebhookData.prototype, "timestamp", void 0);
class IssuerWebhookDto {
}
exports.IssuerWebhookDto = IssuerWebhookDto;
__decorate([
    (0, class_validator_1.IsEnum)(IssuerWebhookEventType),
    __metadata("design:type", String)
], IssuerWebhookDto.prototype, "eventType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IssuerWebhookDto.prototype, "webhookId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], IssuerWebhookDto.prototype, "timestamp", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => TransactionWebhookData),
    __metadata("design:type", TransactionWebhookData)
], IssuerWebhookDto.prototype, "transaction", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CardWebhookData),
    __metadata("design:type", CardWebhookData)
], IssuerWebhookDto.prototype, "card", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => FundingWebhookData),
    __metadata("design:type", FundingWebhookData)
], IssuerWebhookDto.prototype, "funding", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IssuerWebhookDto.prototype, "signature", void 0);
//# sourceMappingURL=issuer-webhook.dto.js.map