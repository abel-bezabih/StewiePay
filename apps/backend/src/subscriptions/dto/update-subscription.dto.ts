import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsString()
  merchant?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  amountHint?: number | null;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  nextExpectedCharge?: string | null;

  @IsOptional()
  @IsDateString()
  lastChargeAt?: string | null;
}

