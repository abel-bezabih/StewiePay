import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WebhookQueueService } from './webhook-queue.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notification.module';
import { TransactionsModule } from '../transactions/transaction.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [PrismaModule, NotificationsModule, TransactionsModule, IntegrationsModule],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookQueueService],
  exports: [WebhookService, WebhookQueueService]
})
export class WebhookModule {}






