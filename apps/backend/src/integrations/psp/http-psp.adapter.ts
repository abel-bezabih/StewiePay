import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PspAdapter, TopUpRequest, TopUpResponse } from './psp.adapter';

@Injectable()
export class HttpPspAdapter implements PspAdapter {
  private readonly baseUrl: string | undefined;
  private readonly apiKey: string | undefined;

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.get<string>('PSP_BASE_URL');
    this.apiKey = this.config.get<string>('PSP_API_KEY');
  }

  private assertConfigured() {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error('PSP not configured. Set PSP_BASE_URL and PSP_API_KEY.');
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
        throw new Error(text || `PSP request failed (${resp.status})`);
      }
      return (await resp.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  async initiateTopUp(request: TopUpRequest): Promise<TopUpResponse> {
    return this.request<TopUpResponse>('/topups/initiate', request);
  }

  async verifyTopUp(providerReference: string): Promise<TopUpResponse> {
    return this.request<TopUpResponse>('/topups/verify', { providerReference });
  }
}
