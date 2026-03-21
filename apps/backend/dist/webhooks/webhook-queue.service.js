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
var WebhookQueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookQueueService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const webhook_service_1 = require("./webhook.service");
let WebhookQueueService = WebhookQueueService_1 = class WebhookQueueService {
    constructor(prisma, webhookService) {
        this.prisma = prisma;
        this.webhookService = webhookService;
        this.logger = new common_1.Logger(WebhookQueueService_1.name);
        this.maxAttempts = 5;
        this.baseBackoffMs = 5000;
        this.timer = null;
        this.processing = false;
    }
    onModuleInit() {
        this.timer = setInterval(() => {
            this.processBatch().catch((error) => {
                this.logger.error(`Webhook queue batch failed: ${String(error?.message || error)}`);
            });
        }, 2000);
    }
    onModuleDestroy() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    async enqueueIssuer(payload) {
        const webhookId = payload.webhookId;
        await this.enqueue('issuer', webhookId, payload, payload.signature);
    }
    async enqueuePsp(payload) {
        const webhookId = payload.webhookId;
        await this.enqueue('psp', webhookId, payload, payload.signature);
    }
    async enqueueChapa(payload, signature) {
        const webhookId = String(payload?.tx_ref || payload?.reference || `chapa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
        await this.enqueue('chapa', webhookId, payload, signature);
    }
    async enqueue(source, webhookId, payload, signature) {
        try {
            await this.prisma.webhookJob.create({
                data: {
                    source,
                    webhookId,
                    payload,
                    signature,
                    status: 'PENDING'
                }
            });
        }
        catch (error) {
            if (error?.code === 'P2002') {
                this.logger.warn(`Duplicate queued webhook ignored: ${source}:${webhookId}`);
                return;
            }
            throw error;
        }
    }
    async processBatch() {
        if (this.processing)
            return;
        this.processing = true;
        try {
            const now = new Date();
            const jobs = await this.prisma.webhookJob.findMany({
                where: {
                    status: { in: ['PENDING', 'RETRY'] },
                    nextAttemptAt: { lte: now }
                },
                orderBy: { createdAt: 'asc' },
                take: 10
            });
            for (const job of jobs) {
                // optimistic lock to avoid multiple workers taking the same job
                const claimed = await this.prisma.webhookJob.updateMany({
                    where: { id: job.id, status: { in: ['PENDING', 'RETRY'] } },
                    data: { status: 'PROCESSING', lockedAt: new Date() }
                });
                if (claimed.count === 0)
                    continue;
                await this.processJob(job.id);
            }
        }
        finally {
            this.processing = false;
        }
    }
    async listJobs(options) {
        const take = Math.min(Math.max(options?.limit ?? 50, 1), 200);
        return this.prisma.webhookJob.findMany({
            where: {
                ...(options?.status ? { status: options.status } : {}),
                ...(options?.source ? { source: options.source } : {})
            },
            orderBy: { createdAt: 'desc' },
            take,
            select: {
                id: true,
                source: true,
                webhookId: true,
                status: true,
                attemptCount: true,
                lastError: true,
                nextAttemptAt: true,
                lockedAt: true,
                processedAt: true,
                createdAt: true,
                updatedAt: true
            }
        });
    }
    async retryJob(jobId) {
        const job = await this.prisma.webhookJob.findUnique({
            where: { id: jobId },
            select: { id: true, status: true }
        });
        if (!job) {
            return { updated: false, reason: 'not_found' };
        }
        if (job.status === 'PROCESSING') {
            return { updated: false, reason: 'already_processing' };
        }
        await this.prisma.webhookJob.update({
            where: { id: jobId },
            data: {
                status: 'RETRY',
                nextAttemptAt: new Date(),
                lockedAt: null
            }
        });
        return { updated: true };
    }
    async retryFailed(limit) {
        const take = Math.min(Math.max(limit ?? 100, 1), 500);
        const failedJobs = await this.prisma.webhookJob.findMany({
            where: { status: 'FAILED' },
            orderBy: { createdAt: 'asc' },
            take,
            select: { id: true }
        });
        if (!failedJobs.length) {
            return { queued: 0 };
        }
        const ids = failedJobs.map((j) => j.id);
        const updated = await this.prisma.webhookJob.updateMany({
            where: { id: { in: ids } },
            data: {
                status: 'RETRY',
                nextAttemptAt: new Date(),
                lockedAt: null
            }
        });
        return { queued: updated.count };
    }
    async processJob(jobId) {
        const job = await this.prisma.webhookJob.findUnique({ where: { id: jobId } });
        if (!job)
            return;
        try {
            if (job.source === 'issuer') {
                const payload = job.payload;
                if (!payload.signature && job.signature)
                    payload.signature = job.signature;
                await this.webhookService.processIssuerWebhook(payload);
            }
            else if (job.source === 'psp') {
                const payload = job.payload;
                if (!payload.signature && job.signature)
                    payload.signature = job.signature;
                await this.webhookService.processPspWebhook(payload);
            }
            else {
                await this.webhookService.processChapaWebhook(job.payload, job.signature || undefined);
            }
            await this.prisma.webhookJob.update({
                where: { id: jobId },
                data: {
                    status: 'PROCESSED',
                    processedAt: new Date(),
                    lastError: null
                }
            });
        }
        catch (error) {
            const attemptCount = job.attemptCount + 1;
            const exhausted = attemptCount >= this.maxAttempts;
            const delayMs = this.baseBackoffMs * Math.pow(2, Math.max(0, attemptCount - 1));
            await this.prisma.webhookJob.update({
                where: { id: jobId },
                data: {
                    attemptCount,
                    status: exhausted ? 'FAILED' : 'RETRY',
                    lastError: String(error?.message || error || 'unknown webhook processing error'),
                    nextAttemptAt: exhausted ? new Date() : new Date(Date.now() + delayMs),
                    lockedAt: null
                }
            });
        }
    }
};
exports.WebhookQueueService = WebhookQueueService;
exports.WebhookQueueService = WebhookQueueService = WebhookQueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        webhook_service_1.WebhookService])
], WebhookQueueService);
//# sourceMappingURL=webhook-queue.service.js.map