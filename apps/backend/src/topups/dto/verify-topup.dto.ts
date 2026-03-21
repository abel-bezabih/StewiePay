import { IsString } from 'class-validator';

export class VerifyTopUpDto {
  @IsString()
  topUpId!: string;
}




















