import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CardsService } from './card.service';
import { MerchantLockService } from './merchant-lock.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardLimitsDto } from './dto/update-card-limits.dto';
import { UpdateMerchantLocksDto } from './dto/update-merchant-locks.dto';
import { UpdateTimeWindowDto } from './dto/update-time-window.dto';
import { CardCreationRateLimitGuard } from './card-creation-rate-limit.guard';

@UseGuards(JwtAuthGuard)
@Controller('cards')
export class CardsController {
  constructor(
    private readonly cardsService: CardsService,
    private readonly merchantLockService: MerchantLockService
  ) {}

  @Post()
  @UseGuards(CardCreationRateLimitGuard)
  create(@Req() req: any, @Body() dto: CreateCardDto) {
    return this.cardsService.create(req.user.userId, dto);
  }

  @Get()
  list(@Req() req: any) {
    return this.cardsService.listForUser(req.user.userId);
  }

  @Patch(':id/freeze')
  freeze(@Req() req: any, @Param('id') id: string) {
    return this.cardsService.freeze(id, req.user.userId);
  }

  @Patch(':id/unfreeze')
  unfreeze(@Req() req: any, @Param('id') id: string) {
    return this.cardsService.unfreeze(id, req.user.userId);
  }

  @Patch(':id/merchant-locks')
  async updateMerchantLocks(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateMerchantLocksDto
  ) {
    // Verify user has access to the card
    await this.cardsService.getAccessibleCard(id, req.user.userId);
    return this.merchantLockService.updateMerchantLocks(id, dto);
  }

  @Patch(':id/limits')
  updateLimits(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCardLimitsDto
  ) {
    return this.cardsService.updateLimits(id, req.user.userId, dto);
  }

  @Get('mcc-categories')
  getMccCategories() {
    return this.merchantLockService.getCommonMccCategories();
  }

  @Patch(':id/time-window')
  updateTimeWindow(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateTimeWindowDto
  ) {
    return this.cardsService.updateTimeWindow(id, req.user.userId, dto);
  }
}






