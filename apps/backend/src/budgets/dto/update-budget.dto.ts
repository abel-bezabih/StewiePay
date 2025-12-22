import { IsString, IsInt, IsPositive, IsEnum, IsOptional, Max } from 'class-validator';

export class UpdateBudgetDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(100_000_000)
  amount?: number;

  @IsOptional()
  @IsEnum(['monthly', 'weekly'])
  period?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}







