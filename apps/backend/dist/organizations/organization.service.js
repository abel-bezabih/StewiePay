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
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let OrganizationsService = class OrganizationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(ownerId, dto) {
        return this.prisma.organization.create({
            data: {
                name: dto.name,
                ownerId
            }
        });
    }
    async listForUser(userId) {
        return this.prisma.organization.findMany({
            where: {
                OR: [
                    { ownerId: userId },
                    { members: { some: { userId } } }
                ]
            },
            include: {
                members: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async assertAdminOrOwner(orgId, userId) {
        const org = await this.prisma.organization.findUnique({
            where: { id: orgId },
            include: { members: true }
        });
        if (!org)
            throw new common_1.NotFoundException('Organization not found');
        const isOwner = org.ownerId === userId;
        const isAdmin = org.members.some((m) => m.userId === userId && m.role === client_1.OrgRole.ADMIN);
        if (!(isOwner || isAdmin)) {
            throw new common_1.UnauthorizedException('Requires org owner or admin');
        }
        return org;
    }
    async addMember(orgId, actorId, dto) {
        await this.assertAdminOrOwner(orgId, actorId);
        return this.prisma.organizationMember.upsert({
            where: {
                userId_organizationId: {
                    userId: dto.userId,
                    organizationId: orgId
                }
            },
            update: { role: dto.role },
            create: {
                userId: dto.userId,
                organizationId: orgId,
                role: dto.role
            }
        });
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrganizationsService);
//# sourceMappingURL=organization.service.js.map