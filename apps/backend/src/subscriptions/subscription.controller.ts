import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SubscriptionsService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { ListSubscriptionsDto } from './dto/list-subscriptions.dto';

@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(req.user.userId, dto);
  }

  @Get()
  list(@Req() req: any, @Query() query: ListSubscriptionsDto) {
    return this.subscriptionsService.list(req.user.userId, { cardId: query.cardId });
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.subscriptionsService.remove(req.user.userId, id);
  }
}

