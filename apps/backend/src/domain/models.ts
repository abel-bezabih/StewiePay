export enum UserRole {
  INDIVIDUAL = 'INDIVIDUAL',
  BUSINESS = 'BUSINESS',
  ADMIN = 'ADMIN'
}

export enum CardStatus {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN',
  CLOSED = 'CLOSED'
}

export enum CardType {
  PERMANENT = 'PERMANENT',
  BURNER = 'BURNER',
  MERCHANT_LOCKED = 'MERCHANT_LOCKED',
  SUBSCRIPTION_ONLY = 'SUBSCRIPTION_ONLY',
  ADS_ONLY = 'ADS_ONLY'
}

export enum TransactionStatus {
  AUTHORIZED = 'AUTHORIZED',
  SETTLED = 'SETTLED',
  DECLINED = 'DECLINED'
}

export enum TopUpStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
};

export type OrganizationMember = {
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
};

export type Organization = {
  id: string;
  name: string;
  ownerId: string;
  members: OrganizationMember[];
};

export type Card = {
  id: string;
  issuerCardId: string;
  status: CardStatus;
  type: CardType;
  limitDaily?: number;
  limitMonthly?: number;
  limitPerTxn?: number;
  currency: string;
  ownerUserId?: string;
  ownerOrgId?: string;
};

export type Transaction = {
  id: string;
  cardId: string;
  amount: number;
  currency: string;
  merchantName: string;
  mcc?: string;
  category?: string;
  timestamp: string;
  status: TransactionStatus;
};

export type TopUp = {
  id: string;
  userId?: string;
  orgId?: string;
  provider: string;
  reference: string;
  amount: number;
  currency: string;
  status: TopUpStatus;
};

export type Subscription = {
  id: string;
  cardId: string;
  merchant: string;
  amountHint?: number;
  currency: string;
  nextExpectedCharge?: string;
  lastChargeAt?: string;
};




















