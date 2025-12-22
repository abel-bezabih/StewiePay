import { OrganizationsService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
export declare class OrganizationsController {
    private readonly orgsService;
    constructor(orgsService: OrganizationsService);
    create(req: any, dto: CreateOrganizationDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
    list(req: any): Promise<({
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
    addMember(req: any, id: string, dto: AddMemberDto): Promise<{
        role: import(".prisma/client").$Enums.OrgRole;
        id: string;
        createdAt: Date;
        userId: string;
        organizationId: string;
    }>;
}
