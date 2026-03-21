import { Module } from '@nestjs/common';
import { TransactionsService } from './transaction.service';
import { TransactionsController } from './transaction.controller';
import { TransactionCategoryService } from './transaction-category.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CardsModule } from '../cards/card.module';
import { NotificationsModule } from '../notifications/notification.module';
import { UsersModule } from '../users/user.module';

@Module({
  imports: [PrismaModule, CardsModule, NotificationsModule, UsersModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionCategoryService],
  exports: [TransactionsService, TransactionCategoryService]
})
export class TransactionsModule {}

// TimeWindowService is imported via CardsModule






