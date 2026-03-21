import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookService } from './webhook.service';
import { IssuerWebhookDto } from './dto/issuer-webhook.dto';
import { PspWebhookDto } from './dto/psp-webhook.dto';
type WebhookSource = 'issuer' | 'psp' | 'chapa';
export declare class WebhookQueueService implements OnModuleInit, OnModuleDestroy {
    private prisma;
    private webhookService;
    private readonly logger;
    private readonly maxAttempts;
    private readonly baseBackoffMs;
    private timer;
    private processing;
    constructor(prisma: PrismaService, webhookService: WebhookService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    enqueueIssuer(payload: IssuerWebhookDto): Promise<void>;
    enqueuePsp(payload: PspWebhookDto): Promise<void>;
    enqueueChapa(payload: any, signature?: string): Promise<void>;
    private enqueue;
    private processBatch;
    listJobs(options?: {
        status?: 'PENDING' | 'RETRY' | 'PROCESSING' | 'FAILED' | 'PROCESSED';
        source?: WebhookSource;
        limit?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        source: string;
        webhookId: string;
        attemptCount: number;
        lastError: string | null;
        nextAttemptAt: Date;
        lockedAt: Date | null;
        processedAt: Date | null;
    }[]>;
    retryJob(jobId: string): Promise<{
        updated: boolean;
        reason: "not_found";
    } | {
        updated: boolean;
        reason: "already_processing";
    } | {
        updated: boolean;
        reason?: undefined;
    }>;
    retryFailed(limit?: number): Promise<{
        queued: number;
    }>;
    private processJob;
}
export {};
