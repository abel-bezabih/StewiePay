import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SubscriptionDetectionService } from './subscription-detection.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { CardsService } from '../cards/card.service';

@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionDetectionService,
    private readonly cardsService: CardsService
  ) {}

  @Get()
  async list(@Req() req: any) {
    return this.subscriptionService.getSubscriptionsForUser(req.user.userId);
  }

  @Get('card/:cardId')
  async listForCard(@Req() req: any, @Param('cardId') cardId: string) {
    // Verify user has access to card
    await this.cardsService.getAccessibleCard(cardId, req.user.userId);
    return this.subscriptionService.getSubscriptionsForCard(cardId);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateSubscriptionDto) {
    // Verify user has access to card
    await this.cardsService.getAccessibleCard(dto.cardId, req.user.userId);

    return this.subscriptionService.createSubscription(
      dto.cardId,
      dto.merchant,
      dto.amountHint,
      dto.nextExpectedCharge ? new Date(dto.nextExpectedCharge) : undefined
    );
  }

  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto
  ) {
    // Get subscription to verify access
    const subscription = await this.subscriptionService.getSubscriptionById(id);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    await this.cardsService.getAccessibleCard(subscription.cardId, req.user.userId);

    return this.subscriptionService.updateSubscription(id, {
      merchant: dto.merchant,
      amountHint: dto.amountHint,
      nextExpectedCharge: dto.nextExpectedCharge ? new Date(dto.nextExpectedCharge) : undefined,
      lastChargeAt: dto.lastChargeAt ? new Date(dto.lastChargeAt) : undefined
    });
  }

  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    // Get subscription to verify access
    const subscription = await this.subscriptionService.getSubscriptionById(id);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    await this.cardsService.getAccessibleCard(subscription.cardId, req.user.userId);

    return this.subscriptionService.deleteSubscription(id);
  }
}

