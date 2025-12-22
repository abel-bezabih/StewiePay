import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';
import { DummyIssuerAdapter } from '../integrations/issuer/dummy-issuer.adapter';
import { UsersService } from '../users/user.service';
import { TimeWindowService } from './time-window.service';
import { UpdateTimeWindowDto } from './dto/update-time-window.dto';
import { NotificationService } from '../notifications/notification.service';
export declare class CardsService {
    private prisma;
    private issuer;
    private usersService;
    private timeWindowService;
    private notificationService;
    private readonly MAX_CARDS_PER_USER;
    private readonly MAX_CARDS_PER_ORG;
    constructor(prisma: PrismaService, issuer: DummyIssuerAdapter, usersService: UsersService, timeWindowService: TimeWindowService, notificationService: NotificationService);
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
    /**
     * Assert user has access to organization
     */
    private assertOrgAccess;
    /**
     * Create a new card with full authentication and authorization checks
     */
    create(userId: string, dto: CreateCardDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        issuerCardId: string;
        status: import(".prisma/client").$Enums.CardStatus;
        type: import(".prisma/client").$Enums.CardType;
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
        issuerCardId: string;
        status: import(".prisma/client").$Enums.CardStatus;
        type: import(".prisma/client").$Enums.CardType;
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
        issuerCardId: string;
        status: import(".prisma/client").$Enums.CardStatus;
        type: import(".prisma/client").$Enums.CardType;
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
        issuerCardId: string;
        status: import(".prisma/client").$Enums.CardStatus;
        type: import(".prisma/client").$Enums.CardType;
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
        issuerCardId: string;
        status: import(".prisma/client").$Enums.CardStatus;
        type: import(".prisma/client").$Enums.CardType;
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
        issuerCardId: string;
        status: import(".prisma/client").$Enums.CardStatus;
        type: import(".prisma/client").$Enums.CardType;
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
