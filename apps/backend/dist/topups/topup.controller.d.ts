import { TopUpService } from './topup.service';
import { InitiateTopUpDto } from './dto/initiate-topup.dto';
import { VerifyTopUpDto } from './dto/verify-topup.dto';
export declare class TopUpController {
    private readonly topupService;
    constructor(topupService: TopUpService);
    initiate(req: any, dto: InitiateTopUpDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        status: import(".prisma/client").$Enums.TopUpStatus;
        provider: string;
        currency: string;
        orgId: string | null;
        amount: number;
        reference: string;
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
    }[]>;
}
