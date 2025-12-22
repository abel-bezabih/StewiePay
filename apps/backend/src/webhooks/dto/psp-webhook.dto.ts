import { IsString, IsEnum, IsOptional, IsNumber, IsDateString } from 'class-validator';

export enum PspWebhookEventType {
  TOPUP_PENDING = 'topup.pending',
  TOPUP_COMPLETED = 'topup.completed',
  TOPUP_FAILED = 'topup.failed'
}

export class PspWebhookDto {
  @IsEnum(PspWebhookEventType)
  eventType!: PspWebhookEventType;

  @IsString()
  webhookId!: string;

  @IsString()
  providerReference!: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  orgId?: string;

  @IsNumber()
  amount!: number;

  @IsString()
  currency!: string;

  @IsDateString()
  timestamp!: string;

  @IsOptional()
  @IsString()
  failureReason?: string;

  @IsOptional()
  @IsString()
  signature?: string; // For webhook signature verification
}







