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
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
const issuer_webhook_dto_1 = require("./dto/issuer-webhook.dto");
const psp_webhook_dto_1 = require("./dto/psp-webhook.dto");
const webhook_queue_service_1 = require("./webhook-queue.service");
const list_webhook_jobs_dto_1 = require("./dto/list-webhook-jobs.dto");
let WebhookController = class WebhookController {
    constructor(webhookQueue) {
        this.webhookQueue = webhookQueue;
    }
    assertAdmin(req) {
        if (req.user?.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Admin access required');
        }
    }
    async issuer(payload) {
        await this.webhookQueue.enqueueIssuer(payload);
        return { ok: true, queued: true };
    }
    async psp(payload) {
        await this.webhookQueue.enqueuePsp(payload);
        return { ok: true, queued: true };
    }
    async chapa(payload, headers) {
        const signature = headers['x-chapa-signature'] ||
            headers['chapa-signature'] ||
            headers['X-Chapa-Signature'] ||
            headers['Chapa-Signature'];
        await this.webhookQueue.enqueueChapa(payload, signature);
        return { ok: true, queued: true };
    }
    async listJobs(req, query) {
        this.assertAdmin(req);
        const jobs = await this.webhookQueue.listJobs(query);
        return { items: jobs };
    }
    async retryJob(req, jobId) {
        this.assertAdmin(req);
        const result = await this.webhookQueue.retryJob(jobId);
        return { ok: true, ...result };
    }
    async retryFailed(req, limit) {
        this.assertAdmin(req);
        const parsedLimit = limit ? Number(limit) : undefined;
        const result = await this.webhookQueue.retryFailed(Number.isFinite(parsedLimit) ? parsedLimit : undefined);
        return { ok: true, ...result };
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Post)('issuer'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [issuer_webhook_dto_1.IssuerWebhookDto]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "issuer", null);
__decorate([
    (0, common_1.Post)('psp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [psp_webhook_dto_1.PspWebhookDto]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "psp", null);
__decorate([
    (0, common_1.Post)('chapa'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "chapa", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('jobs'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_webhook_jobs_dto_1.ListWebhookJobsDto]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "listJobs", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('jobs/:jobId/retry'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "retryJob", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('jobs/retry-failed'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "retryFailed", null);
exports.WebhookController = WebhookController = __decorate([
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [webhook_queue_service_1.WebhookQueueService])
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map