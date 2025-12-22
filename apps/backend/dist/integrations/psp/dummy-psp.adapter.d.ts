import { PspAdapter, TopUpRequest, TopUpResponse } from './psp.adapter';
export declare class DummyPspAdapter implements PspAdapter {
    initiateTopUp(request: TopUpRequest): Promise<TopUpResponse>;
    verifyTopUp(providerReference: string): Promise<TopUpResponse>;
}
