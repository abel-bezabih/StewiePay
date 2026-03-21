import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { TransactionStatus } from '@prisma/client';

export class CreateTransactionDto {
  @IsString()
  cardId!: string;

  @IsInt()
  @Min(1)
  @Max(50_000_000)
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

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;
}




















