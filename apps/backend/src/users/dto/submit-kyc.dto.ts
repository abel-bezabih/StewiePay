import { IsIn, IsOptional, IsString } from 'class-validator';

export class SubmitKycDto {
  @IsIn(['passport', 'national_id', 'driver_license'])
  documentType!: 'passport' | 'national_id' | 'driver_license';

  @IsString()
  country!: string;

  @IsString()
  documentFront!: string;

  @IsOptional()
  @IsString()
  documentBack?: string;

  @IsString()
  selfie!: string;
}
