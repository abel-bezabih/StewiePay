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
exports.TopUpController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
const topup_service_1 = require("./topup.service");
const initiate_topup_dto_1 = require("./dto/initiate-topup.dto");
const verify_topup_dto_1 = require("./dto/verify-topup.dto");
let TopUpController = class TopUpController {
    constructor(topupService) {
        this.topupService = topupService;
    }
    initiate(req, dto) {
        return this.topupService.initiate(req.user.userId, dto);
    }
    verify(req, dto) {
        return this.topupService.verify(req.user.userId, dto.topUpId);
    }
    list(req) {
        return this.topupService.list(req.user.userId);
    }
};
exports.TopUpController = TopUpController;
__decorate([
    (0, common_1.Post)('initiate'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, initiate_topup_dto_1.InitiateTopUpDto]),
    __metadata("design:returntype", void 0)
], TopUpController.prototype, "initiate", null);
__decorate([
    (0, common_1.Post)('verify'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, verify_topup_dto_1.VerifyTopUpDto]),
    __metadata("design:returntype", void 0)
], TopUpController.prototype, "verify", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TopUpController.prototype, "list", null);
exports.TopUpController = TopUpController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('topups'),
    __metadata("design:paramtypes", [topup_service_1.TopUpService])
], TopUpController);
//# sourceMappingURL=topup.controller.js.map