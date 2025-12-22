import { PrismaService } from '../prisma/prisma.service';
import { InitiateTopUpDto } from './dto/initiate-topup.dto';
import { DummyPspAdapter } from '../integrations/psp/dummy-psp.adapter';
export declare class TopUpService {
    private prisma;
    private psp;
    constructor(prisma: PrismaService, psp: DummyPspAdapter);
    private assertOrgAccess;
    initiate(userId: string, dto: InitiateTopUpDto): Promise<{
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
    verify(userId: string, topUpId: string): Promise<{
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
    list(userId: string): Promise<{
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
