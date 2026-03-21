import { IsOptional, IsUUID } from 'class-validator';

export class ListSubscriptionsDto {
  @IsOptional()
  @IsUUID()
  cardId?: string;
}

