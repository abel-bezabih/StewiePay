import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookService } from './webhook.service';
import { IssuerWebhookDto } from './dto/issuer-webhook.dto';
import { PspWebhookDto } from './dto/psp-webhook.dto';

type WebhookSource = 'issuer' | 'psp' | 'chapa';

@Injectable()
export class WebhookQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebhookQueueService.name);
  private readonly maxAttempts = 5;
  private readonly baseBackoffMs = 5000;
  private timer: NodeJS.Timeout | null = null;
  private processing = false;

  constructor(
    private prisma: PrismaService,
    private webhookService: WebhookService
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      this.processBatch().catch((error) => {
        this.logger.error(`Webhook queue batch failed: ${String((error as Error)?.message || error)}`);
      });
    }, 2000);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async enqueueIssuer(payload: IssuerWebhookDto) {
    const webhookId = payload.webhookId;
    await this.enqueue('issuer', webhookId, payload, payload.signature);
  }

  async enqueuePsp(payload: PspWebhookDto) {
    const webhookId = payload.webhookId;
    await this.enqueue('psp', webhookId, payload, payload.signature);
  }

  async enqueueChapa(payload: any, signature?: string) {
    const webhookId = String(payload?.tx_ref || payload?.reference || `chapa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    await this.enqueue('chapa', webhookId, payload, signature);
  }

  private async enqueue(source: WebhookSource, webhookId: string, payload: any, signature?: string) {
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
    } catch (error: any) {
      if (error?.code === 'P2002') {
        this.logger.warn(`Duplicate queued webhook ignored: ${source}:${webhookId}`);
        return;
      }
      throw error;
    }
  }

  private async processBatch() {
    if (this.processing) return;
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
        if (claimed.count === 0) continue;
        await this.processJob(job.id);
      }
    } finally {
      this.processing = false;
    }
  }

  async listJobs(options?: {
    status?: 'PENDING' | 'RETRY' | 'PROCESSING' | 'FAILED' | 'PROCESSED';
    source?: WebhookSource;
    limit?: number;
  }) {
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

  async retryJob(jobId: string) {
    const job = await this.prisma.webhookJob.findUnique({
      where: { id: jobId },
      select: { id: true, status: true }
    });
    if (!job) {
      return { updated: false, reason: 'not_found' as const };
    }
    if (job.status === 'PROCESSING') {
      return { updated: false, reason: 'already_processing' as const };
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

  async retryFailed(limit?: number) {
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

  private async processJob(jobId: string) {
    const job = await this.prisma.webhookJob.findUnique({ where: { id: jobId } });
    if (!job) return;

    try {
      if (job.source === 'issuer') {
        const payload = job.payload as unknown as IssuerWebhookDto;
        if (!payload.signature && job.signature) payload.signature = job.signature;
        await this.webhookService.processIssuerWebhook(payload);
      } else if (job.source === 'psp') {
        const payload = job.payload as unknown as PspWebhookDto;
        if (!payload.signature && job.signature) payload.signature = job.signature;
        await this.webhookService.processPspWebhook(payload);
      } else {
        await this.webhookService.processChapaWebhook(job.payload as any, job.signature || undefined);
      }

      await this.prisma.webhookJob.update({
        where: { id: jobId },
        data: {
          status: 'PROCESSED',
          processedAt: new Date(),
          lastError: null
        }
      });
    } catch (error: any) {
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
}
