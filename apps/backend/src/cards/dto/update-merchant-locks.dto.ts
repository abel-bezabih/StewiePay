import { IsArray, IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';

export class UpdateMerchantLocksDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blockedCategories?: string[]; // MCC codes

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedCategories?: string[]; // MCC codes

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blockedMerchants?: string[]; // Merchant names/IDs

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedMerchants?: string[]; // Merchant names/IDs

  @IsOptional()
  @IsEnum(['BLOCK', 'ALLOW'])
  merchantLockMode?: 'BLOCK' | 'ALLOW';
}







