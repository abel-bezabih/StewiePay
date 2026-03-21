import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListKycReviewsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @IsOptional()
  @IsEnum(['PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED'] as const)
  status?: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  @IsString()
  reviewerEmail?: string;

  @IsOptional()
  @IsString()
  subjectEmail?: string;
}
