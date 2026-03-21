export declare enum IssuerWebhookEventType {
    TRANSACTION_AUTHORIZED = "transaction.authorized",
    TRANSACTION_SETTLED = "transaction.settled",
    TRANSACTION_DECLINED = "transaction.declined",
    CARD_FROZEN = "card.frozen",
    CARD_UNFROZEN = "card.unfrozen",
    CARD_CLOSED = "card.closed",
    CARD_LIMIT_UPDATED = "card.limit_updated",
    FUNDING_LOADED = "funding.loaded",
    FUNDING_FAILED = "funding.failed",
    FUNDING_PENDING = "funding.pending"
}
export declare class TransactionWebhookData {
    transactionId: string;
    cardId: string;
    amount: number;
    currency: string;
    merchantName: string;
    mcc?: string;
    category?: string;
    timestamp: string;
}
export declare class CardWebhookData {
    cardId: string;
    limitDaily?: number;
    limitMonthly?: number;
    limitPerTxn?: number;
}
export declare class FundingWebhookData {
    topUpReference: string;
    providerReference?: string;
    issuerReference?: string;
    reason?: string;
    timestamp?: string;
}
export declare class IssuerWebhookDto {
    eventType: IssuerWebhookEventType;
    webhookId: string;
    timestamp: string;
    transaction?: TransactionWebhookData;
    card?: CardWebhookData;
    funding?: FundingWebhookData;
    signature?: string;
}
