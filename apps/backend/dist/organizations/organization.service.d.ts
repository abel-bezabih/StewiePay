import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
export declare class OrganizationsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(ownerId: string, dto: CreateOrganizationDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
    listForUser(userId: string): Promise<({
        members: {
            role: import(".prisma/client").$Enums.OrgRole;
            id: string;
            createdAt: Date;
            userId: string;
            organizationId: string;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    })[]>;
    private assertAdminOrOwner;
    addMember(orgId: string, actorId: string, dto: AddMemberDto): Promise<{
        role: import(".prisma/client").$Enums.OrgRole;
        id: string;
        createdAt: Date;
        userId: string;
        organizationId: string;
    }>;
}
