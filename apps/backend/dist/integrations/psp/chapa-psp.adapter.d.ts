import { ConfigService } from '@nestjs/config';
import { PspAdapter, TopUpRequest, TopUpResponse } from './psp.adapter';
export declare class ChapaPspAdapter implements PspAdapter {
    private config;
    private readonly baseUrl;
    private readonly secretKey?;
    private readonly callbackUrl?;
    private readonly returnUrl?;
    private readonly title?;
    private readonly description?;
    private readonly defaultEmail?;
    constructor(config: ConfigService);
    private assertConfigured;
    private isValidEmail;
    private request;
    initiateTopUp(request: TopUpRequest): Promise<TopUpResponse>;
    verifyTopUp(providerReference: string): Promise<TopUpResponse>;
}
