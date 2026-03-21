"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopUpService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const psp_adapter_1 = require("../integrations/psp/psp.adapter");
const client_1 = require("@prisma/client");
const user_service_1 = require("../users/user.service");
let TopUpService = class TopUpService {
    constructor(prisma, psp, usersService) {
        this.prisma = prisma;
        this.psp = psp;
        this.usersService = usersService;
        // Top-up limits (ETB) for V1 demo safety
        this.MAX_TOPUP_PER_TXN = 50000000;
        this.MAX_TOPUP_DAILY = 5000000;
        this.MAX_TOPUP_MONTHLY = 50000000;
        // Optional limits for users in KYC SUBMITTED state when explicitly enabled
        this.LIMITED_TOPUP_PER_TXN = Number(process.env.KYC_LIMITED_TOPUP_PER_TXN ?? 5000);
        this.LIMITED_TOPUP_DAILY = Number(process.env.KYC_LIMITED_TOPUP_DAILY ?? 20000);
        this.LIMITED_TOPUP_MONTHLY = Number(process.env.KYC_LIMITED_TOPUP_MONTHLY ?? 100000);
    }
    async assertOrgAccess(userId, orgId) {
        const org = await this.prisma.organization.findUnique({
            where: { id: orgId },
            include: { members: true }
        });
        if (!org)
            throw new common_1.NotFoundException('Organization not found');
        const isOwner = org.ownerId === userId;
        const isMember = org.members.some((m) => m.userId === userId);
        if (!(isOwner || isMember))
            throw new common_1.UnauthorizedException('No access to this org');
        return org;
    }
    async initiate(userId, dto) {
        if (dto.orgId) {
            await this.assertOrgAccess(userId, dto.orgId);
        }
        const paymentAccess = await this.usersService.assertPaymentKycEligible(userId, 'initiate a top-up', {
            allowSubmittedWithLimits: true
        });
        await this.assertTopUpLimits(userId, dto.orgId, dto.amount, paymentAccess.tier);
        const user = await this.usersService.findById(userId);
        const baseReference = (dto.reference || '').trim() || `topup-${Date.now()}`;
        const existing = await this.prisma.topUp.findFirst({
            where: { reference: baseReference },
            select: { id: true }
        });
        const safeReference = existing
            ? `${baseReference}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
            : baseReference;
        const [firstName, ...rest] = (user?.name || 'StewiePay User').split(' ');
        const lastName = rest.length ? rest.join(' ') : 'User';
        let pspResp;
        try {
            pspResp = await this.psp.initiateTopUp({
                userId: dto.orgId ? undefined : userId,
                orgId: dto.orgId,
                email: user?.email,
                firstName,
                lastName,
                phoneNumber: user?.phone || undefined,
                amount: dto.amount,
                currency: dto.currency,
                reference: safeReference
            });
        }
        catch (error) {
            const msg = String(error?.message || '');
            if (msg.toLowerCase().includes('validation.email') || msg.toLowerCase().includes('email')) {
                throw new common_1.BadRequestException('Top-up failed: payment provider rejected the email address. Please update your account email and try again.');
            }
            throw new common_1.BadRequestException(`Top-up failed: ${msg || 'provider error'}`);
        }
        const topUp = await this.prisma.topUp.create({
            data: {
                provider: pspResp.provider,
                reference: safeReference,
                amount: dto.amount,
                currency: dto.currency,
                status: client_1.TopUpStatus.PENDING,
                fundingState: client_1.TopUpFundingState.PSP_PENDING,
                userId: dto.orgId ? undefined : userId,
                orgId: dto.orgId
            }
        });
        await this.logFundingEvent(topUp.id, {
            source: 'SYSTEM',
            eventType: 'topup.initiated',
            fromState: null,
            toState: client_1.TopUpFundingState.PSP_PENDING,
            message: 'Top-up initiated; waiting for PSP confirmation.',
            payload: { provider: topUp.provider, reference: topUp.reference }
        });
        return { ...topUp, checkoutUrl: pspResp.checkoutUrl };
    }
    getTopUpLimitsForTier(tier) {
        if (tier === 'LIMITED') {
            return {
                perTxn: this.LIMITED_TOPUP_PER_TXN,
                daily: this.LIMITED_TOPUP_DAILY,
                monthly: this.LIMITED_TOPUP_MONTHLY
            };
        }
        return {
            perTxn: this.MAX_TOPUP_PER_TXN,
            daily: this.MAX_TOPUP_DAILY,
            monthly: this.MAX_TOPUP_MONTHLY
        };
    }
    async assertTopUpLimits(userId, orgId, amount, tier) {
        const limits = this.getTopUpLimitsForTier(tier);
        if (amount > limits.perTxn) {
            throw new common_1.BadRequestException(`Top-up exceeds per-transaction limit of ${limits.perTxn.toLocaleString()}`);
        }
        const scope = orgId ? { orgId } : { userId };
        const statuses = [client_1.TopUpStatus.PENDING, client_1.TopUpStatus.COMPLETED];
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const [daySum, monthSum] = await Promise.all([
            this.prisma.topUp.aggregate({
                where: {
                    ...scope,
                    status: { in: statuses },
                    createdAt: { gte: startOfDay }
                },
                _sum: { amount: true }
            }),
            this.prisma.topUp.aggregate({
                where: {
                    ...scope,
                    status: { in: statuses },
                    createdAt: { gte: startOfMonth }
                },
                _sum: { amount: true }
            })
        ]);
        const dailyTotal = (daySum._sum.amount ?? 0) + amount;
        const monthlyTotal = (monthSum._sum.amount ?? 0) + amount;
        if (dailyTotal > limits.daily) {
            throw new common_1.BadRequestException(`Daily top-up limit exceeded (${limits.daily.toLocaleString()})`);
        }
        if (monthlyTotal > limits.monthly) {
            throw new common_1.BadRequestException(`Monthly top-up limit exceeded (${limits.monthly.toLocaleString()})`);
        }
    }
    async verify(userId, topUpId) {
        const topUp = await this.prisma.topUp.findUnique({ where: { id: topUpId } });
        if (!topUp)
            throw new common_1.NotFoundException('Top up not found');
        if (topUp.userId && topUp.userId !== userId) {
            throw new common_1.UnauthorizedException('No access to this top up');
        }
        if (topUp.orgId) {
            await this.assertOrgAccess(userId, topUp.orgId);
        }
        const resp = await this.psp.verifyTopUp(topUp.reference);
        const nextFundingState = resp.status === 'COMPLETED'
            ? client_1.TopUpFundingState.PSP_CONFIRMED
            : resp.status === 'FAILED'
                ? client_1.TopUpFundingState.FAILED
                : client_1.TopUpFundingState.PSP_PENDING;
        const updated = await this.prisma.topUp.update({
            where: { id: topUpId },
            data: {
                status: resp.status,
                fundingState: nextFundingState,
                pspCompletedAt: resp.status === 'COMPLETED' ? new Date() : topUp.pspCompletedAt,
                settlementFailureReason: resp.status === 'FAILED' ? `PSP verification failed (${resp.provider})` : topUp.settlementFailureReason
            }
        });
        await this.logFundingEvent(topUp.id, {
            source: 'PSP',
            eventType: 'topup.verify',
            fromState: topUp.fundingState,
            toState: nextFundingState,
            message: resp.status === 'COMPLETED'
                ? 'PSP verification confirmed funding.'
                : resp.status === 'FAILED'
                    ? 'PSP verification marked funding as failed.'
                    : 'PSP verification still pending.',
            payload: resp
        });
        return updated;
    }
    async list(userId) {
        // List user topups + orgs they belong to
        const orgMemberships = await this.prisma.organizationMember.findMany({
            where: { userId },
            select: { organizationId: true }
        });
        const orgIds = orgMemberships.map((m) => m.organizationId);
        return this.prisma.topUp.findMany({
            where: {
                OR: [
                    { userId },
                    ...(orgIds.length ? [{ orgId: { in: orgIds } }] : [])
                ]
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getSettlementStatus(userId, topUpId) {
        const topUp = await this.prisma.topUp.findUnique({
            where: { id: topUpId }
        });
        if (!topUp) {
            throw new common_1.NotFoundException('Top up not found');
        }
        if (topUp.userId && topUp.userId !== userId) {
            throw new common_1.UnauthorizedException('No access to this top up');
        }
        if (topUp.orgId) {
            await this.assertOrgAccess(userId, topUp.orgId);
        }
        const events = await this.prisma.fundingSettlementEvent.findMany({
            where: { topUpId },
            orderBy: { createdAt: 'asc' }
        });
        return { topUp, events };
    }
    async logFundingEvent(topUpId, event) {
        await this.prisma.fundingSettlementEvent.create({
            data: {
                topUpId,
                source: event.source,
                eventType: event.eventType,
                fromState: event.fromState,
                toState: event.toState,
                message: event.message,
                payload: event.payload
            }
        });
    }
};
exports.TopUpService = TopUpService;
exports.TopUpService = TopUpService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(psp_adapter_1.PSP_ADAPTER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object, user_service_1.UsersService])
], TopUpService);
//# sourceMappingURL=topup.service.js.map