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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopUpService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const dummy_psp_adapter_1 = require("../integrations/psp/dummy-psp.adapter");
const client_1 = require("@prisma/client");
let TopUpService = class TopUpService {
    constructor(prisma, psp) {
        this.prisma = prisma;
        this.psp = psp;
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
        const pspResp = await this.psp.initiateTopUp({
            userId: dto.orgId ? undefined : userId,
            orgId: dto.orgId,
            amount: dto.amount,
            currency: dto.currency,
            reference: dto.reference
        });
        return this.prisma.topUp.create({
            data: {
                provider: pspResp.provider,
                reference: dto.reference,
                amount: dto.amount,
                currency: dto.currency,
                status: client_1.TopUpStatus.PENDING,
                userId: dto.orgId ? undefined : userId,
                orgId: dto.orgId
            }
        });
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
        return this.prisma.topUp.update({
            where: { id: topUpId },
            data: { status: resp.status }
        });
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
};
exports.TopUpService = TopUpService;
exports.TopUpService = TopUpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, dummy_psp_adapter_1.DummyPspAdapter])
], TopUpService);
//# sourceMappingURL=topup.service.js.map