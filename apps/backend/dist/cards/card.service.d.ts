import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';
import { IssuerAdapter } from '../integrations/issuer/issuer.adapter';
import { UsersService } from '../users/user.service';
import { TimeWindowService } from './time-window.service';
import { UpdateTimeWindowDto } from './dto/update-time-window.dto';
import { NotificationService } from '../notifications/notification.service';
import { UpdateCardLimitsDto } from './dto/update-card-limits.dto';
export declare class CardsService {
    private prisma;
    private issuer;
    private usersService;
    private timeWindowService;
    private notificationService;
    private readonly MAX_CARDS_PER_USER;
    constructor(prisma: PrismaService, issuer: IssuerAdapter, usersService: UsersService, timeWindowService: TimeWindowService, notificationService: NotificationService);
    /**
     * Verify user account is in good standing
     */
    private verifyUserAccount;
    /**
     * Check if user has reached card creation limit
     */
    private checkCardCreationLimit;
    /**
     * Validate card limits are reasonable
     */
    private validateCardLimits;
    private validateLimitsUpdate;
    /**
     * Create a new card with full authentication and authorization checks
     */
    create(userId: string, dto: CreateCardDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.CardStatus;
        type: import(".prisma/client").$Enums.CardType;
        issuerCardId: string;
        limitDaily: number | null;
        limitMonthly: number | null;
        limitPerTxn: number | null;
        currency: string;
        blockedCategories: string[];
        allowedCategories: string[];
        blockedMerchants: string[];
        allowedMerchants: string[];
        merchantLockMode: string | null;
        timeWindowEnabled: boolean;
        timeWindowConfig: string | null;
        ownerUserId: string | null;
        ownerOrgId: string | null;
    }>;
    listForUser(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.CardStatus;
        type: import(".prisma/client").$Enums.CardType;
        issuerCardId: string;
        limitDaily: number | null;
        limitMonthly: number | null;
        limitPerTxn: number | null;
        currency: string;
        blockedCategories: string[];
        allowedCategories: string[];
        blockedMerchants: string[];
        allowedMerchants: string[];
        merchantLockMode: string | null;
        timeWindowEnabled: boolean;
        timeWindowConfig: string | null;
        ownerUserId: string | null;
        ownerOrgId: string | null;
    }[]>;
    getAccessibleCard(cardId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.CardStatus;
        type: import(".prisma/client").$Enums.CardType;
        issuerCardId: string;
        limitDaily: number | null;
        limitMonthly: number | null;
        limitPerTxn: number | null;
        currency: string;
        blockedCategories: string[];
        allowedCategories: string[];
        blockedMerchants: string[];
        allowedMerchants: string[];
        merchantLockMode: string | null;
        timeWindowEnabled: boolean;
        timeWindowConfig: string | null;
        ownerUserId: string | null;
        ownerOrgId: string | null;
    }>;
    getAccessibleCardIds(userId: string): Promise<string[]>;
    freeze(cardId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.CardStatus;
        type: import(".prisma/client").$Enums.CardType;
        issuerCardId: string;
        limitDaily: number | null;
        limitMonthly: number | null;
        limitPerTxn: number | null;
        currency: string;
        blockedCategories: string[];
        allowedCategories: string[];
        blockedMerchants: string[];
        allowedMerchants: string[];
        merchantLockMode: string | null;
        timeWindowEnabled: boolean;
        timeWindowConfig: string | null;
        ownerUserId: string | null;
        ownerOrgId: string | null;
    }>;
    unfreeze(cardId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.CardStatus;
        type: import(".prisma/client").$Enums.CardType;
        issuerCardId: string;
        limitDaily: number | null;
        limitMonthly: number | null;
        limitPerTxn: number | null;
        currency: string;
        blockedCategories: string[];
        allowedCategories: string[];
        blockedMerchants: string[];
        allowedMerchants: string[];
        merchantLockMode: string | null;
        timeWindowEnabled: boolean;
        timeWindowConfig: string | null;
        ownerUserId: string | null;
        ownerOrgId: string | null;
    }>;
    updateLimits(cardId: string, userId: string, dto: UpdateCardLimitsDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.CardStatus;
        type: import(".prisma/client").$Enums.CardType;
        issuerCardId: string;
        limitDaily: number | null;
        limitMonthly: number | null;
        limitPerTxn: number | null;
        currency: string;
        blockedCategories: string[];
        allowedCategories: string[];
        blockedMerchants: string[];
        allowedMerchants: string[];
        merchantLockMode: string | null;
        timeWindowEnabled: boolean;
        timeWindowConfig: string | null;
        ownerUserId: string | null;
        ownerOrgId: string | null;
    }>;
    updateTimeWindow(cardId: string, userId: string, dto: UpdateTimeWindowDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.CardStatus;
        type: import(".prisma/client").$Enums.CardType;
        issuerCardId: string;
        limitDaily: number | null;
        limitMonthly: number | null;
        limitPerTxn: number | null;
        currency: string;
        blockedCategories: string[];
        allowedCategories: string[];
        blockedMerchants: string[];
        allowedMerchants: string[];
        merchantLockMode: string | null;
        timeWindowEnabled: boolean;
        timeWindowConfig: string | null;
        ownerUserId: string | null;
        ownerOrgId: string | null;
    }>;
}
