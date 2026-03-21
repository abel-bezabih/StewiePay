import { PrismaService } from '../prisma/prisma.service';
import { CardsService } from '../cards/card.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
export declare class SubscriptionsService {
    private readonly prisma;
    private readonly cardsService;
    constructor(prisma: PrismaService, cardsService: CardsService);
    create(userId: string, dto: CreateSubscriptionDto): Promise<{
        id: string;
        currency: string;
        merchant: string;
        cardId: string;
        amountHint: number | null;
        nextExpectedCharge: Date | null;
        lastChargeAt: Date | null;
    }>;
    list(userId: string, options?: {
        cardId?: string;
    }): Promise<{
        id: string;
        currency: string;
        merchant: string;
        cardId: string;
        amountHint: number | null;
        nextExpectedCharge: Date | null;
        lastChargeAt: Date | null;
    }[]>;
    update(userId: string, subscriptionId: string, dto: UpdateSubscriptionDto): Promise<{
        id: string;
        currency: string;
        merchant: string;
        cardId: string;
        amountHint: number | null;
        nextExpectedCharge: Date | null;
        lastChargeAt: Date | null;
    }>;
    remove(userId: string, subscriptionId: string): Promise<{
        deleted: boolean;
    }>;
}
