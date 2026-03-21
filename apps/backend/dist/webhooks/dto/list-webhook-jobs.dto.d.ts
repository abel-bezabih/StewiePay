export declare class ListWebhookJobsDto {
    status?: 'PENDING' | 'RETRY' | 'PROCESSING' | 'FAILED' | 'PROCESSED';
    source?: 'issuer' | 'psp' | 'chapa';
    limit?: number;
}
