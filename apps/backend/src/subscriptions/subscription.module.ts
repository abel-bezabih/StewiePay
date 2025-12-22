import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionDetectionService } from './subscription-detection.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CardsModule } from '../cards/card.module';

@Module({
  imports: [PrismaModule, CardsModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionDetectionService],
  exports: [SubscriptionDetectionService]
})
export class SubscriptionsModule {}







