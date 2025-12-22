import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { OrgRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateOrganizationDto) {
    return this.prisma.organization.create({
      data: {
        name: dto.name,
        ownerId
      }
    });
  }

  async listForUser(userId: string) {
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

  private async assertAdminOrOwner(orgId: string, userId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: { members: true }
    });
    if (!org) throw new NotFoundException('Organization not found');
    const isOwner = org.ownerId === userId;
    const isAdmin = org.members.some((m) => m.userId === userId && m.role === OrgRole.ADMIN);
    if (!(isOwner || isAdmin)) {
      throw new UnauthorizedException('Requires org owner or admin');
    }
    return org;
  }

  async addMember(orgId: string, actorId: string, dto: AddMemberDto) {
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
}

