import { IsArray, IsBoolean, IsOptional, IsString, Matches, Min, Max } from 'class-validator';

export class UpdateTimeWindowDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsArray()
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format (e.g., "09:00")'
  })
  startTime?: string; // HH:mm format

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:mm format (e.g., "17:00")'
  })
  endTime?: string; // HH:mm format

  @IsOptional()
  @IsString()
  timezone?: string; // e.g., "Africa/Addis_Ababa"
}







