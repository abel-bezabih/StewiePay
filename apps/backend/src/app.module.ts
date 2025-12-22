import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { CardsModule } from './cards/card.module';
import { OrganizationsModule } from './organizations/organization.module';
import { TransactionsModule } from './transactions/transaction.module';
import { TopUpModule } from './topups/topup.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { WebhookModule } from './webhooks/webhook.module';
import { SubscriptionsModule } from './subscriptions/subscription.module';
import { NotificationsModule } from './notifications/notification.module';
import { BudgetsModule } from './budgets/budget.module';

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
    OrganizationsModule,
    TransactionsModule,
    TopUpModule,
    AnalyticsModule,
    WebhookModule,
    SubscriptionsModule,
    NotificationsModule,
    BudgetsModule
  ],
  controllers: [AppController]
})
export class AppModule {}


