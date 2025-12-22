import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  cardId!: string;

  @IsString()
  merchant!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  amountHint?: number;

  @IsOptional()
  @IsDateString()
  nextExpectedCharge?: string;
}







