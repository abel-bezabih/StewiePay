import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InitiateTopUpDto } from './dto/initiate-topup.dto';
import { DummyPspAdapter } from '../integrations/psp/dummy-psp.adapter';
import { TopUpStatus } from '@prisma/client';

@Injectable()
export class TopUpService {
  constructor(private prisma: PrismaService, private psp: DummyPspAdapter) {}

  private async assertOrgAccess(userId: string, orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: { members: true }
    });
    if (!org) throw new NotFoundException('Organization not found');
    const isOwner = org.ownerId === userId;
    const isMember = org.members.some((m) => m.userId === userId);
    if (!(isOwner || isMember)) throw new UnauthorizedException('No access to this org');
    return org;
  }

  async initiate(userId: string, dto: InitiateTopUpDto) {
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
        status: TopUpStatus.PENDING,
        userId: dto.orgId ? undefined : userId,
        orgId: dto.orgId
      }
    });
  }

  async verify(userId: string, topUpId: string) {
    const topUp = await this.prisma.topUp.findUnique({ where: { id: topUpId } });
    if (!topUp) throw new NotFoundException('Top up not found');

    if (topUp.userId && topUp.userId !== userId) {
      throw new UnauthorizedException('No access to this top up');
    }
    if (topUp.orgId) {
      await this.assertOrgAccess(userId, topUp.orgId);
    }

    const resp = await this.psp.verifyTopUp(topUp.reference);
    return this.prisma.topUp.update({
      where: { id: topUpId },
      data: { status: resp.status as TopUpStatus }
    });
  }

  async list(userId: string) {
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
}












