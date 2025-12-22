import { PrismaService } from '../prisma/prisma.service';
type RefreshTokenRecord = {
    id: string;
    tokenHash: string;
    userId: string;
    expiresAt: Date;
    revokedAt: Date | null;
};
export declare class RefreshTokenService {
    private prisma;
    constructor(prisma: PrismaService);
    private ttlDays;
    private saltRounds;
    private buildTokenString;
    private parseTokenString;
    generate(userId: string): Promise<string>;
    private assertValid;
    verify(token: string): Promise<RefreshTokenRecord>;
    rotate(token: string): Promise<{
        userId: string;
        refreshToken: string;
    }>;
    revoke(token: string): Promise<void>;
}
export {};
