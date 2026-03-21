import { IsString, IsEnum, IsOptional, IsNumber, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum IssuerWebhookEventType {
  TRANSACTION_AUTHORIZED = 'transaction.authorized',
  TRANSACTION_SETTLED = 'transaction.settled',
  TRANSACTION_DECLINED = 'transaction.declined',
  CARD_FROZEN = 'card.frozen',
  CARD_UNFROZEN = 'card.unfrozen',
  CARD_CLOSED = 'card.closed',
  CARD_LIMIT_UPDATED = 'card.limit_updated',
  FUNDING_LOADED = 'funding.loaded',
  FUNDING_FAILED = 'funding.failed',
  FUNDING_PENDING = 'funding.pending'
}

export class TransactionWebhookData {
  @IsString()
  transactionId!: string;

  @IsString()
  cardId!: string;

  @IsNumber()
  amount!: number;

  @IsString()
  currency!: string;

  @IsString()
  merchantName!: string;

  @IsOptional()
  @IsString()
  mcc?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsDateString()
  timestamp!: string;
}

export class CardWebhookData {
  @IsString()
  cardId!: string;

  @IsOptional()
  @IsNumber()
  limitDaily?: number;

  @IsOptional()
  @IsNumber()
  limitMonthly?: number;

  @IsOptional()
  @IsNumber()
  limitPerTxn?: number;
}

export class FundingWebhookData {
  @IsString()
  topUpReference!: string;

  @IsOptional()
  @IsString()
  providerReference?: string;

  @IsOptional()
  @IsString()
  issuerReference?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsDateString()
  timestamp?: string;
}

export class IssuerWebhookDto {
  @IsEnum(IssuerWebhookEventType)
  eventType!: IssuerWebhookEventType;

  @IsString()
  webhookId!: string;

  @IsDateString()
  timestamp!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TransactionWebhookData)
  transaction?: TransactionWebhookData;

  @IsOptional()
  @ValidateNested()
  @Type(() => CardWebhookData)
  card?: CardWebhookData;

  @IsOptional()
  @ValidateNested()
  @Type(() => FundingWebhookData)
  funding?: FundingWebhookData;

  @IsOptional()
  @IsString()
  signature?: string; // For webhook signature verification
}















