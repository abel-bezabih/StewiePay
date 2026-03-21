import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { CardsModule } from './cards/card.module';
import { TransactionsModule } from './transactions/transaction.module';
import { TopUpModule } from './topups/topup.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { WebhookModule } from './webhooks/webhook.module';
import { NotificationsModule } from './notifications/notification.module';
import { SubscriptionsModule } from './subscriptions/subscription.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    IntegrationsModule,
    CardsModule,
    TransactionsModule,
    TopUpModule,
    SubscriptionsModule,
    AnalyticsModule,
    WebhookModule,
    NotificationsModule
  ],
  controllers: [AppController]
})
export class AppModule {}


