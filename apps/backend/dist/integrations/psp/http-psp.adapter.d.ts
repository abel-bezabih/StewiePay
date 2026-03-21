import { ConfigService } from '@nestjs/config';
import { PspAdapter, TopUpRequest, TopUpResponse } from './psp.adapter';
export declare class HttpPspAdapter implements PspAdapter {
    private config;
    private readonly baseUrl;
    private readonly apiKey;
    constructor(config: ConfigService);
    private assertConfigured;
    private request;
    initiateTopUp(request: TopUpRequest): Promise<TopUpResponse>;
    verifyTopUp(providerReference: string): Promise<TopUpResponse>;
}
