import { CardStatus } from '@prisma/client';
import { IssuerAdapter, IssueCardRequest, IssuedCard } from './issuer.adapter';
export declare class DummyIssuerAdapter implements IssuerAdapter {
    issueCard(request: IssueCardRequest): Promise<IssuedCard>;
    freezeCard(_issuerCardId: string): Promise<CardStatus>;
    unfreezeCard(_issuerCardId: string): Promise<CardStatus>;
}
