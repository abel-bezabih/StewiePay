import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListWebhookJobsDto {
  @IsOptional()
  @IsEnum(['PENDING', 'RETRY', 'PROCESSING', 'FAILED', 'PROCESSED'] as const)
  status?: 'PENDING' | 'RETRY' | 'PROCESSING' | 'FAILED' | 'PROCESSED';

  @IsOptional()
  @IsEnum(['issuer', 'psp', 'chapa'] as const)
  source?: 'issuer' | 'psp' | 'chapa';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
