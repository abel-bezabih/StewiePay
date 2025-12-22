import { IsEnum, IsInt, IsOptional, IsPositive, IsString, Max } from 'class-validator';
import { CardType } from '@prisma/client';

export class CreateCardDto {
  @IsOptional()
  @IsEnum(CardType)
  type?: CardType;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(10_000_000)
  limitDaily?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(20_000_000)
  limitMonthly?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(5_000_000)
  limitPerTxn?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  // If provided, card is owned by an organization; otherwise by the user.
  @IsOptional()
  @IsString()
  orgId?: string;
}

