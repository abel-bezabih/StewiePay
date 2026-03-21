import { IssuerWebhookDto } from './dto/issuer-webhook.dto';
import { PspWebhookDto } from './dto/psp-webhook.dto';
import { WebhookQueueService } from './webhook-queue.service';
import { ListWebhookJobsDto } from './dto/list-webhook-jobs.dto';
export declare class WebhookController {
    private readonly webhookQueue;
    constructor(webhookQueue: WebhookQueueService);
    private assertAdmin;
    issuer(payload: IssuerWebhookDto): Promise<{
        ok: boolean;
        queued: boolean;
    }>;
    psp(payload: PspWebhookDto): Promise<{
        ok: boolean;
        queued: boolean;
    }>;
    chapa(payload: any, headers: Record<string, string | string[]>): Promise<{
        ok: boolean;
        queued: boolean;
    }>;
    listJobs(req: any, query: ListWebhookJobsDto): Promise<{
        items: {
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
        }[];
    }>;
    retryJob(req: any, jobId: string): Promise<{
        updated: boolean;
        reason: "not_found";
        ok: boolean;
    } | {
        updated: boolean;
        reason: "already_processing";
        ok: boolean;
    } | {
        updated: boolean;
        reason?: undefined;
        ok: boolean;
    }>;
    retryFailed(req: any, limit?: string): Promise<{
        queued: number;
        ok: boolean;
    }>;
}
