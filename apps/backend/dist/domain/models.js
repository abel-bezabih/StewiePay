"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopUpStatus = exports.TransactionStatus = exports.CardType = exports.CardStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["INDIVIDUAL"] = "INDIVIDUAL";
    UserRole["BUSINESS"] = "BUSINESS";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var CardStatus;
(function (CardStatus) {
    CardStatus["ACTIVE"] = "ACTIVE";
    CardStatus["FROZEN"] = "FROZEN";
    CardStatus["CLOSED"] = "CLOSED";
})(CardStatus || (exports.CardStatus = CardStatus = {}));
var CardType;
(function (CardType) {
    CardType["PERMANENT"] = "PERMANENT";
    CardType["BURNER"] = "BURNER";
    CardType["MERCHANT_LOCKED"] = "MERCHANT_LOCKED";
    CardType["SUBSCRIPTION_ONLY"] = "SUBSCRIPTION_ONLY";
    CardType["ADS_ONLY"] = "ADS_ONLY";
})(CardType || (exports.CardType = CardType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["AUTHORIZED"] = "AUTHORIZED";
    TransactionStatus["SETTLED"] = "SETTLED";
    TransactionStatus["DECLINED"] = "DECLINED";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var TopUpStatus;
(function (TopUpStatus) {
    TopUpStatus["PENDING"] = "PENDING";
    TopUpStatus["COMPLETED"] = "COMPLETED";
    TopUpStatus["FAILED"] = "FAILED";
})(TopUpStatus || (exports.TopUpStatus = TopUpStatus = {}));
//# sourceMappingURL=models.js.map