import { SubscriptionDetectionService } from './subscription-detection.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { CardsService } from '../cards/card.service';
export declare class SubscriptionController {
    private readonly subscriptionService;
    private readonly cardsService;
    constructor(subscriptionService: SubscriptionDetectionService, cardsService: CardsService);
    list(req: any): Promise<({
        card: {
            id: string;
            issuerCardId: string;
            status: import(".prisma/client").$Enums.CardStatus;
        };
    } & {
        id: string;
        currency: string;
        merchant: string;
        cardId: string;
        amountHint: number | null;
        nextExpectedCharge: Date | null;
        lastChargeAt: Date | null;
    })[]>;
    listForCard(req: any, cardId: string): Promise<{
        id: string;
        currency: string;
        merchant: string;
        cardId: string;
        amountHint: number | null;
        nextExpectedCharge: Date | null;
        lastChargeAt: Date | null;
    }[]>;
    create(req: any, dto: CreateSubscriptionDto): Promise<{
        id: string;
        currency: string;
        merchant: string;
        cardId: string;
        amountHint: number | null;
        nextExpectedCharge: Date | null;
        lastChargeAt: Date | null;
    }>;
    update(req: any, id: string, dto: UpdateSubscriptionDto): Promise<{
        id: string;
        currency: string;
        merchant: string;
        cardId: string;
        amountHint: number | null;
        nextExpectedCharge: Date | null;
        lastChargeAt: Date | null;
    }>;
    delete(req: any, id: string): Promise<{
        id: string;
        currency: string;
        merchant: string;
        cardId: string;
        amountHint: number | null;
        nextExpectedCharge: Date | null;
        lastChargeAt: Date | null;
    }>;
}
