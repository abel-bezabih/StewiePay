import { SubscriptionsService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { ListSubscriptionsDto } from './dto/list-subscriptions.dto';
export declare class SubscriptionsController {
    private readonly subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    create(req: any, dto: CreateSubscriptionDto): Promise<{
        id: string;
        currency: string;
        merchant: string;
        cardId: string;
        amountHint: number | null;
        nextExpectedCharge: Date | null;
        lastChargeAt: Date | null;
    }>;
    list(req: any, query: ListSubscriptionsDto): Promise<{
        id: string;
        currency: string;
        merchant: string;
        cardId: string;
        amountHint: number | null;
        nextExpectedCharge: Date | null;
        lastChargeAt: Date | null;
    }[]>;
    update(req: any, id: string, dto: UpdateSubscriptionDto): Promise<{
        id: string;
        currency: string;
        merchant: string;
        cardId: string;
        amountHint: number | null;
        nextExpectedCharge: Date | null;
        lastChargeAt: Date | null;
    }>;
    remove(req: any, id: string): Promise<{
        deleted: boolean;
    }>;
}
