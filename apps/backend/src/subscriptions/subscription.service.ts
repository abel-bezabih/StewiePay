import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CardsService } from '../cards/card.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cardsService: CardsService
  ) {}

  async create(userId: string, dto: CreateSubscriptionDto) {
    await this.cardsService.getAccessibleCard(dto.cardId, userId);
    return this.prisma.subscription.create({
      data: {
        cardId: dto.cardId,
        merchant: dto.merchant.trim(),
        amountHint: dto.amountHint,
        currency: dto.currency?.trim() || 'ETB',
        nextExpectedCharge: dto.nextExpectedCharge ? new Date(dto.nextExpectedCharge) : null
      }
    });
  }

  async list(userId: string, options?: { cardId?: string }) {
    if (options?.cardId) {
      await this.cardsService.getAccessibleCard(options.cardId, userId);
      return this.prisma.subscription.findMany({
        where: { cardId: options.cardId },
        orderBy: [{ nextExpectedCharge: 'asc' }, { id: 'desc' }]
      });
    }

    const cardIds = await this.cardsService.getAccessibleCardIds(userId);
    if (!cardIds.length) return [];

    return this.prisma.subscription.findMany({
      where: { cardId: { in: cardIds } },
      orderBy: [{ nextExpectedCharge: 'asc' }, { id: 'desc' }]
    });
  }

  async update(userId: string, subscriptionId: string, dto: UpdateSubscriptionDto) {
    const existing = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId }
    });
    if (!existing) {
      throw new NotFoundException('Subscription not found');
    }

    await this.cardsService.getAccessibleCard(existing.cardId, userId);
    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        merchant: dto.merchant?.trim(),
        amountHint: dto.amountHint,
        currency: dto.currency?.trim(),
        nextExpectedCharge:
          dto.nextExpectedCharge === null
            ? null
            : dto.nextExpectedCharge
              ? new Date(dto.nextExpectedCharge)
              : undefined,
        lastChargeAt:
          dto.lastChargeAt === null
            ? null
            : dto.lastChargeAt
              ? new Date(dto.lastChargeAt)
              : undefined
      }
    });
  }

  async remove(userId: string, subscriptionId: string) {
    const existing = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId }
    });
    if (!existing) {
      throw new NotFoundException('Subscription not found');
    }

    await this.cardsService.getAccessibleCard(existing.cardId, userId);
    await this.prisma.subscription.delete({ where: { id: subscriptionId } });
    return { deleted: true };
  }
}

