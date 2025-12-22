import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notification.module';
import { SubscriptionsModule } from '../subscriptions/subscription.module';
import { TransactionsModule } from '../transactions/transaction.module';

@Module({
  imports: [PrismaModule, NotificationsModule, SubscriptionsModule, TransactionsModule],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService]
})
export class WebhookModule {}






