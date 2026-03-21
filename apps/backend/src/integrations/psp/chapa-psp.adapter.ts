import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PspAdapter, TopUpRequest, TopUpResponse } from './psp.adapter';

type ChapaInitResponse = {
  status: string;
  message?: string;
  data?: {
    checkout_url?: string;
    reference?: string;
  };
};

type ChapaVerifyResponse = {
  status: string;
  message?: string;
  data?: {
    status?: string;
    reference?: string;
  };
};

@Injectable()
export class ChapaPspAdapter implements PspAdapter {
  private readonly baseUrl = 'https://api.chapa.co/v1';
  private readonly secretKey?: string;
  private readonly callbackUrl?: string;
  private readonly returnUrl?: string;
  private readonly title?: string;
  private readonly description?: string;
  private readonly defaultEmail?: string;

  constructor(private config: ConfigService) {
    this.secretKey = this.config.get<string>('PSP_API_KEY');
    this.callbackUrl = this.config.get<string>('CHAPA_CALLBACK_URL');
    this.returnUrl = this.config.get<string>('CHAPA_RETURN_URL');
    this.title = this.config.get<string>('CHAPA_CUSTOMIZATION_TITLE');
    this.description = this.config.get<string>('CHAPA_CUSTOMIZATION_DESCRIPTION');
    this.defaultEmail = this.config.get<string>('CHAPA_DEFAULT_EMAIL');
  }

  private assertConfigured() {
    if (!this.secretKey) {
      throw new Error('Chapa is not configured. Set PSP_API_KEY.');
    }
  }

  private isValidEmail(value?: string) {
    if (!value) return false;
    const email = value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
    const domain = email.split('@')[1] || '';
    if (domain === 'localhost' || domain.endsWith('.local') || domain.endsWith('.localhost')) {
      return false;
    }
    return true;
  }

  private async request<T>(path: string, method: 'POST' | 'GET', body?: any): Promise<T> {
    this.assertConfigured();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const resp = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || `Chapa request failed (${resp.status})`);
      }
      return (await resp.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  async initiateTopUp(request: TopUpRequest): Promise<TopUpResponse> {
    const emailCandidates = [
      request.email,
      this.defaultEmail,
      this.config.get<string>('EMAIL_FROM'),
      this.config.get<string>('GMAIL_USER'),
      'stewiepay.verify@gmail.com'
    ];
    const email = emailCandidates.find((candidate) => this.isValidEmail(candidate)) || 'stewiepay.verify@gmail.com';

    const payload: any = {
      amount: String(request.amount),
      currency: request.currency || 'ETB',
      tx_ref: request.reference,
      email,
      first_name: request.firstName || 'StewiePay',
      last_name: request.lastName || 'User'
    };

    if (request.phoneNumber) payload.phone_number = request.phoneNumber;
    if (request.callbackUrl || this.callbackUrl) payload.callback_url = request.callbackUrl || this.callbackUrl;
    if (request.returnUrl || this.returnUrl) payload.return_url = request.returnUrl || this.returnUrl;
    if (this.title || this.description) {
      payload.customization = {
        title: this.title || 'StewiePay Top Up',
        description: this.description || 'Complete your top up securely'
      };
    }

    const resp = await this.request<ChapaInitResponse>('/transaction/initialize', 'POST', payload);
    const checkoutUrl = resp.data?.checkout_url;
    return {
      provider: 'chapa',
      providerReference: request.reference,
      status: 'PENDING',
      checkoutUrl,
      rawStatus: resp.status
    };
  }

  async verifyTopUp(providerReference: string): Promise<TopUpResponse> {
    const resp = await this.request<ChapaVerifyResponse>(`/transaction/verify/${providerReference}`, 'GET');
    const rawStatus = resp.data?.status || resp.status;
    const normalized =
      rawStatus === 'success' || rawStatus === 'SUCCESS'
        ? 'COMPLETED'
        : rawStatus === 'failed' || rawStatus === 'FAILED'
          ? 'FAILED'
          : 'PENDING';
    return {
      provider: 'chapa',
      providerReference,
      status: normalized as TopUpResponse['status'],
      rawStatus
    };
  }
}
