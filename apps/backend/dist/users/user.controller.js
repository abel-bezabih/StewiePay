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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("./user.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const jwt_guard_1 = require("../auth/jwt.guard");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const change_password_dto_1 = require("./dto/change-password.dto");
const upload_avatar_dto_1 = require("./dto/upload-avatar.dto");
const submit_kyc_dto_1 = require("./dto/submit-kyc.dto");
const update_kyc_status_dto_1 = require("./dto/update-kyc-status.dto");
const list_kyc_reviews_dto_1 = require("./dto/list-kyc-reviews.dto");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    create(dto) {
        return this.usersService.create(dto);
    }
    findAll() {
        return this.usersService.findAll();
    }
    getMe(req) {
        return this.usersService.findById(req.user.userId);
    }
    updateProfile(req, dto) {
        return this.usersService.updateProfile(req.user.userId, dto);
    }
    changePassword(req, dto) {
        return this.usersService.changePassword(req.user.userId, dto.currentPassword, dto.newPassword);
    }
    uploadAvatar(req, dto) {
        return this.usersService.uploadAvatar(req.user.userId, dto.image);
    }
    submitKyc(req, dto) {
        return this.usersService.submitKyc(req.user.userId, dto);
    }
    getKycStatus(req) {
        return this.usersService.getKycStatus(req.user.userId);
    }
    listKycSubmissions(req) {
        if (req.user.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Admin access required');
        }
        return this.usersService.listKycSubmissions();
    }
    updateKycStatus(req, userId, dto) {
        if (req.user.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Admin access required');
        }
        return this.usersService.updateKycStatus(userId, dto, {
            reviewerId: req.user.userId,
            reviewerIp: req.ip,
            reviewerUserAgent: req.headers?.['user-agent']
        });
    }
    async exportAllKycReviewsCsv(req, query, res) {
        if (req.user.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Admin access required');
        }
        const csv = await this.usersService.exportAllKycReviewsCsv({
            status: query.status,
            startDate: query.startDate,
            endDate: query.endDate,
            reviewerEmail: query.reviewerEmail,
            subjectEmail: query.subjectEmail
        });
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="kyc-reviews-all-${new Date().toISOString().slice(0, 10)}.csv"`);
        res.status(200).send(csv);
    }
    listKycReviews(req, userId, query) {
        const isAdmin = req.user.role === 'ADMIN';
        const isSelf = req.user.userId === userId;
        if (!isAdmin && !isSelf) {
            throw new common_1.ForbiddenException('Not allowed to view this review history');
        }
        return this.usersService.listKycReviews(userId, query);
    }
    async exportKycReviewsCsv(req, userId, query, res) {
        const isAdmin = req.user.role === 'ADMIN';
        const isSelf = req.user.userId === userId;
        if (!isAdmin && !isSelf) {
            throw new common_1.ForbiddenException('Not allowed to export this review history');
        }
        const csv = await this.usersService.exportKycReviewsCsv(userId, {
            status: query.status,
            startDate: query.startDate,
            endDate: query.endDate,
            reviewerEmail: query.reviewerEmail
        });
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="kyc-reviews-${userId}.csv"`);
        res.status(200).send(csv);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMe", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('me'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('change-password'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "changePassword", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('upload-avatar'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, upload_avatar_dto_1.UploadAvatarDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('kyc/submit'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, submit_kyc_dto_1.SubmitKycDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "submitKyc", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('kyc/status'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getKycStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('kyc/submissions'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "listKycSubmissions", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('kyc/:userId/status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_kyc_status_dto_1.UpdateKycStatusDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateKycStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('kyc/reviews/export.csv'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_kyc_reviews_dto_1.ListKycReviewsDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "exportAllKycReviewsCsv", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('kyc/:userId/reviews'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, list_kyc_reviews_dto_1.ListKycReviewsDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "listKycReviews", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('kyc/:userId/reviews/export.csv'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Query)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, list_kyc_reviews_dto_1.ListKycReviewsDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "exportKycReviewsCsv", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [user_service_1.UsersService])
], UsersController);
//# sourceMappingURL=user.controller.js.map