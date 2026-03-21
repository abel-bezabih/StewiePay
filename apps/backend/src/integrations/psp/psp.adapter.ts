export type TopUpRequest = {
  userId?: string;
  orgId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  callbackUrl?: string;
  returnUrl?: string;
  amount: number;
  currency: string;
  reference: string;
};

export type TopUpResponse = {
  provider: string;
  providerReference: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  checkoutUrl?: string;
  rawStatus?: string;
};

export const PSP_ADAPTER = 'PSP_ADAPTER';

export interface PspAdapter {
  initiateTopUp(request: TopUpRequest): Promise<TopUpResponse>;
  verifyTopUp(providerReference: string): Promise<TopUpResponse>;
}

