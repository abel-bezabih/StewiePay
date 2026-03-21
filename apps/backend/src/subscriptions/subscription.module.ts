import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscription.controller';
import { SubscriptionsService } from './subscription.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CardsModule } from '../cards/card.module';

@Module({
  imports: [PrismaModule, CardsModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService]
})
export class SubscriptionsModule {}

