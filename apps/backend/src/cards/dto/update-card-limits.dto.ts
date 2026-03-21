import { IsInt, IsOptional, IsPositive, Max } from 'class-validator';

export class UpdateCardLimitsDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(10_000_000)
  limitDaily?: number | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(20_000_000)
  limitMonthly?: number | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(5_000_000)
  limitPerTxn?: number | null;
}
