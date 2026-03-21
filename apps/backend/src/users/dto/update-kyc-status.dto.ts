import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateKycStatusDto {
  @IsEnum(['VERIFIED', 'REJECTED'] as const)
  status!: 'VERIFIED' | 'REJECTED';

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  reviewNote?: string;
}
