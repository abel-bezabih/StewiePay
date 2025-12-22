import { CardType } from '@prisma/client';
export declare class CreateCardDto {
    type?: CardType;
    limitDaily?: number;
    limitMonthly?: number;
    limitPerTxn?: number;
    currency?: string;
    orgId?: string;
}
