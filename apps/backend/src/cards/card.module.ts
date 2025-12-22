import { Module } from '@nestjs/common';
import { CardsService } from './card.service';
import { CardsController } from './card.controller';
import { CardCreationRateLimitGuard } from './card-creation-rate-limit.guard';
import { MerchantLockService } from './merchant-lock.service';
import { TimeWindowService } from './time-window.service';
import { PrismaModule } from '../prisma/prisma.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { UsersModule } from '../users/user.module';
import { NotificationsModule } from '../notifications/notification.module';

@Module({
  imports: [PrismaModule, IntegrationsModule, UsersModule, NotificationsModule],
  controllers: [CardsController],
  providers: [CardsService, CardCreationRateLimitGuard, MerchantLockService, TimeWindowService],
  exports: [CardsService, MerchantLockService, TimeWindowService]
})
export class CardsModule {}






