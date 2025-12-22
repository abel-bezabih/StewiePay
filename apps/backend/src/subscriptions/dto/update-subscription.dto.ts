import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsString()
  merchant?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  amountHint?: number;

  @IsOptional()
  @IsDateString()
  nextExpectedCharge?: string;

  @IsOptional()
  @IsDateString()
  lastChargeAt?: string;
}







