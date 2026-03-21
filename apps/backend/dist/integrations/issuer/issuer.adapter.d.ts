import { CardStatus, CardType } from '@prisma/client';
export type IssueCardRequest = {
    ownerReference: string;
    type: CardType;
    limitDaily?: number;
    limitMonthly?: number;
    limitPerTxn?: number;
    currency: string;
};
export type IssuedCard = {
    issuerCardId: string;
    status: CardStatus;
    last4: string;
};
export declare const ISSUER_ADAPTER = "ISSUER_ADAPTER";
export interface IssuerAdapter {
    issueCard(request: IssueCardRequest): Promise<IssuedCard>;
    freezeCard(issuerCardId: string): Promise<CardStatus>;
    unfreezeCard(issuerCardId: string): Promise<CardStatus>;
}
