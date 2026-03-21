import { IsInt, IsOptional, IsPositive, IsString, Max } from 'class-validator';

export class InitiateTopUpDto {
  @IsInt()
  @IsPositive()
  @Max(50_000_000)
  amount!: number;

  @IsString()
  currency!: string;

  @IsString()
  reference!: string;

  @IsOptional()
  @IsString()
  orgId?: string;
}




















