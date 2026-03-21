import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CardStatus } from '@prisma/client';
import { IssuerAdapter, IssueCardRequest, IssuedCard } from './issuer.adapter';

@Injectable()
export class HttpIssuerAdapter implements IssuerAdapter {
  private readonly baseUrl: string | undefined;
  private readonly apiKey: string | undefined;

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.get<string>('ISSUER_BASE_URL');
    this.apiKey = this.config.get<string>('ISSUER_API_KEY');
  }

  private assertConfigured() {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error('Issuer not configured. Set ISSUER_BASE_URL and ISSUER_API_KEY.');
    }
  }

  private async request<T>(path: string, body?: any): Promise<T> {
    this.assertConfigured();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const resp = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || `Issuer request failed (${resp.status})`);
      }
      return (await resp.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  async issueCard(request: IssueCardRequest): Promise<IssuedCard> {
    return this.request<IssuedCard>('/cards/issue', request);
  }

  async freezeCard(issuerCardId: string): Promise<CardStatus> {
    const resp = await this.request<{ status: CardStatus }>('/cards/freeze', { issuerCardId });
    return resp.status;
  }

  async unfreezeCard(issuerCardId: string): Promise<CardStatus> {
    const resp = await this.request<{ status: CardStatus }>('/cards/unfreeze', { issuerCardId });
    return resp.status;
  }
}
