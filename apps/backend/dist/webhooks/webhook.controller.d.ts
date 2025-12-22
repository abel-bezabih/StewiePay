import { WebhookService } from './webhook.service';
import { IssuerWebhookDto } from './dto/issuer-webhook.dto';
import { PspWebhookDto } from './dto/psp-webhook.dto';
export declare class WebhookController {
    private readonly webhookService;
    constructor(webhookService: WebhookService);
    issuer(payload: IssuerWebhookDto): Promise<{
        processed: boolean;
        ok: boolean;
        error?: undefined;
    } | {
        processed: boolean;
        reason: string;
        ok: boolean;
        error?: undefined;
    } | {
        ok: boolean;
        error: any;
    }>;
    psp(payload: PspWebhookDto): Promise<{
        processed: boolean;
        ok: boolean;
        error?: undefined;
    } | {
        processed: boolean;
        reason: string;
        ok: boolean;
        error?: undefined;
    } | {
        ok: boolean;
        error: any;
    }>;
}
