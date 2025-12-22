import { Injectable } from '@nestjs/common';
import { PspAdapter, TopUpRequest, TopUpResponse } from './psp.adapter';

@Injectable()
export class DummyPspAdapter implements PspAdapter {
  async initiateTopUp(request: TopUpRequest): Promise<TopUpResponse> {
    return {
      provider: 'dummy-psp',
      providerReference: `psp-${request.reference}`,
      status: 'PENDING'
    };
  }

  async verifyTopUp(providerReference: string): Promise<TopUpResponse> {
    return {
      provider: 'dummy-psp',
      providerReference,
      status: 'COMPLETED'
    };
  }
}












