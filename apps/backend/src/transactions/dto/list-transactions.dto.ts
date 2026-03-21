import { IsOptional, IsString, IsInt, IsDateString, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionStatus } from '@prisma/client';

export class ListTransactionsDto {
  @IsOptional()
  @IsString()
  cardId?: string;

  @IsOptional()
  @IsString()
  merchantName?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxAmount?: number;

  @IsOptional()
  @IsString()
  search?: string; // Search in merchant name and transaction ID

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;
}















