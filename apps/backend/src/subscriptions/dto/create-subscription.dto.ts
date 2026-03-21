import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateSubscriptionDto {
  @IsUUID()
  cardId!: string;

  @IsString()
  merchant!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  amountHint?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  nextExpectedCharge?: string;
}

