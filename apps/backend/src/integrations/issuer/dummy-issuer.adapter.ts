import { Injectable } from '@nestjs/common';
import { CardStatus, CardType } from '@prisma/client';
import { IssuerAdapter, IssueCardRequest, IssuedCard } from './issuer.adapter';

@Injectable()
export class DummyIssuerAdapter implements IssuerAdapter {
  async issueCard(request: IssueCardRequest): Promise<IssuedCard> {
    return {
      issuerCardId: `issuer-${request.ownerReference}-${Date.now()}`,
      status: CardStatus.ACTIVE,
      last4: '4242'
    };
  }

  async freezeCard(_issuerCardId: string): Promise<CardStatus> {
    return CardStatus.FROZEN;
  }

  async unfreezeCard(_issuerCardId: string): Promise<CardStatus> {
    return CardStatus.ACTIVE;
  }
}

