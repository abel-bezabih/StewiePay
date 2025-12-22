export type TopUpRequest = {
    userId?: string;
    orgId?: string;
    amount: number;
    currency: string;
    reference: string;
};
export type TopUpResponse = {
    provider: string;
    providerReference: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
};
export interface PspAdapter {
    initiateTopUp(request: TopUpRequest): Promise<TopUpResponse>;
    verifyTopUp(providerReference: string): Promise<TopUpResponse>;
}
