import { BadRequestException, Injectable, NotFoundException, UnauthorizedException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InitiateTopUpDto } from './dto/initiate-topup.dto';
import { PSP_ADAPTER, PspAdapter } from '../integrations/psp/psp.adapter';
import { TopUpFundingState, TopUpStatus } from '@prisma/client';
import { PaymentAccessTier, UsersService } from '../users/user.service';

@Injectable()
export class TopUpService {
  // Top-up limits (ETB) for V1 demo safety
  private readonly MAX_TOPUP_PER_TXN = 50_000_000;
  private readonly MAX_TOPUP_DAILY = 5_000_000;
  private readonly MAX_TOPUP_MONTHLY = 50_000_000;
  // Optional limits for users in KYC SUBMITTED state when explicitly enabled
  private readonly LIMITED_TOPUP_PER_TXN = Number(process.env.KYC_LIMITED_TOPUP_PER_TXN ?? 5_000);
  private readonly LIMITED_TOPUP_DAILY = Number(process.env.KYC_LIMITED_TOPUP_DAILY ?? 20_000);
  private readonly LIMITED_TOPUP_MONTHLY = Number(process.env.KYC_LIMITED_TOPUP_MONTHLY ?? 100_000);

  constructor(
    private prisma: PrismaService,
    @Inject(PSP_ADAPTER) private psp: PspAdapter,
    private usersService: UsersService
  ) {}

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
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (msg.toLowerCase().includes('validation.email') || msg.toLowerCase().includes('email')) {
        throw new BadRequestException('Top-up failed: payment provider rejected the email address. Please update your account email and try again.');
      }
      throw new BadRequestException(`Top-up failed: ${msg || 'provider error'}`);
    }

    const topUp = await this.prisma.topUp.create({
      data: {
        provider: pspResp.provider,
        reference: safeReference,
        amount: dto.amount,
        currency: dto.currency,
        status: TopUpStatus.PENDING,
        fundingState: TopUpFundingState.PSP_PENDING,
        userId: dto.orgId ? undefined : userId,
        orgId: dto.orgId
      }
    });
    await this.logFundingEvent(topUp.id, {
      source: 'SYSTEM',
      eventType: 'topup.initiated',
      fromState: null,
      toState: TopUpFundingState.PSP_PENDING,
      message: 'Top-up initiated; waiting for PSP confirmation.',
      payload: { provider: topUp.provider, reference: topUp.reference }
    });
    return { ...topUp, checkoutUrl: pspResp.checkoutUrl };
  }

  private getTopUpLimitsForTier(tier: PaymentAccessTier) {
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

  private async assertTopUpLimits(userId: string, orgId: string | undefined, amount: number, tier: PaymentAccessTier) {
    const limits = this.getTopUpLimitsForTier(tier);
    if (amount > limits.perTxn) {
      throw new BadRequestException(`Top-up exceeds per-transaction limit of ${limits.perTxn.toLocaleString()}`);
    }

    const scope = orgId ? { orgId } : { userId };
    const statuses = [TopUpStatus.PENDING, TopUpStatus.COMPLETED];

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
      throw new BadRequestException(`Daily top-up limit exceeded (${limits.daily.toLocaleString()})`);
    }

    if (monthlyTotal > limits.monthly) {
      throw new BadRequestException(`Monthly top-up limit exceeded (${limits.monthly.toLocaleString()})`);
    }
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
    const nextFundingState =
      resp.status === 'COMPLETED'
        ? TopUpFundingState.PSP_CONFIRMED
        : resp.status === 'FAILED'
          ? TopUpFundingState.FAILED
          : TopUpFundingState.PSP_PENDING;
    const updated = await this.prisma.topUp.update({
      where: { id: topUpId },
      data: {
        status: resp.status as TopUpStatus,
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
      message:
        resp.status === 'COMPLETED'
          ? 'PSP verification confirmed funding.'
          : resp.status === 'FAILED'
            ? 'PSP verification marked funding as failed.'
            : 'PSP verification still pending.',
      payload: resp
    });
    return updated;
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

  async getSettlementStatus(userId: string, topUpId: string) {
    const topUp = await this.prisma.topUp.findUnique({
      where: { id: topUpId }
    });
    if (!topUp) {
      throw new NotFoundException('Top up not found');
    }
    if (topUp.userId && topUp.userId !== userId) {
      throw new UnauthorizedException('No access to this top up');
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

  private async logFundingEvent(
    topUpId: string,
    event: {
      source: string;
      eventType: string;
      fromState: TopUpFundingState | null;
      toState: TopUpFundingState;
      message?: string;
      payload?: any;
    }
  ) {
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
}




















