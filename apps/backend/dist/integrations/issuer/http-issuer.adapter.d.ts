import { ConfigService } from '@nestjs/config';
import { CardStatus } from '@prisma/client';
import { IssuerAdapter, IssueCardRequest, IssuedCard } from './issuer.adapter';
export declare class HttpIssuerAdapter implements IssuerAdapter {
    private config;
    private readonly baseUrl;
    private readonly apiKey;
    constructor(config: ConfigService);
    private assertConfigured;
    private request;
    issueCard(request: IssueCardRequest): Promise<IssuedCard>;
    freezeCard(issuerCardId: string): Promise<CardStatus>;
    unfreezeCard(issuerCardId: string): Promise<CardStatus>;
}
