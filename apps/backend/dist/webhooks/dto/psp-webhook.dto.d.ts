export declare enum PspWebhookEventType {
    TOPUP_PENDING = "topup.pending",
    TOPUP_COMPLETED = "topup.completed",
    TOPUP_FAILED = "topup.failed"
}
export declare class PspWebhookDto {
    eventType: PspWebhookEventType;
    webhookId: string;
    providerReference: string;
    userId?: string;
    orgId?: string;
    amount: number;
    currency: string;
    timestamp: string;
    failureReason?: string;
    signature?: string;
}
