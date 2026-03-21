import { TopUpService } from './topup.service';
import { InitiateTopUpDto } from './dto/initiate-topup.dto';
import { VerifyTopUpDto } from './dto/verify-topup.dto';
export declare class TopUpController {
    private readonly topupService;
    constructor(topupService: TopUpService);
    initiate(req: any, dto: InitiateTopUpDto): Promise<{
        checkoutUrl: string | undefined;
        id: string;
        createdAt: Date;
        userId: string | null;
        status: import(".prisma/client").$Enums.TopUpStatus;
        provider: string;
        currency: string;
        orgId: string | null;
        amount: number;
        reference: string;
        fundingState: import(".prisma/client").$Enums.TopUpFundingState;
        pspCompletedAt: Date | null;
        issuerLoadedAt: Date | null;
        settlementFailureReason: string | null;
    }>;
    verify(req: any, dto: VerifyTopUpDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        status: import(".prisma/client").$Enums.TopUpStatus;
        provider: string;
        currency: string;
        orgId: string | null;
        amount: number;
        reference: string;
        fundingState: import(".prisma/client").$Enums.TopUpFundingState;
        pspCompletedAt: Date | null;
        issuerLoadedAt: Date | null;
        settlementFailureReason: string | null;
    }>;
    list(req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        status: import(".prisma/client").$Enums.TopUpStatus;
        provider: string;
        currency: string;
        orgId: string | null;
        amount: number;
        reference: string;
        fundingState: import(".prisma/client").$Enums.TopUpFundingState;
        pspCompletedAt: Date | null;
        issuerLoadedAt: Date | null;
        settlementFailureReason: string | null;
    }[]>;
    reconciliation(req: any, topUpId: string): Promise<{
        topUp: {
            id: string;
            createdAt: Date;
            userId: string | null;
            status: import(".prisma/client").$Enums.TopUpStatus;
            provider: string;
            currency: string;
            orgId: string | null;
            amount: number;
            reference: string;
            fundingState: import(".prisma/client").$Enums.TopUpFundingState;
            pspCompletedAt: Date | null;
            issuerLoadedAt: Date | null;
            settlementFailureReason: string | null;
        };
        events: {
            id: string;
            createdAt: Date;
            message: string | null;
            topUpId: string;
            source: string;
            eventType: string;
            fromState: import(".prisma/client").$Enums.TopUpFundingState | null;
            toState: import(".prisma/client").$Enums.TopUpFundingState;
            payload: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
    }>;
}
