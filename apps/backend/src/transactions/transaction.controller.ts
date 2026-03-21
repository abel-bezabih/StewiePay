import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TransactionsService } from './transaction.service';
import { TransactionCategoryService } from './transaction-category.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsDto } from './dto/list-transactions.dto';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly txService: TransactionsService,
    private readonly categoryService: TransactionCategoryService
  ) {}

  @Post('simulate')
  simulate(@Req() req: any, @Body() dto: CreateTransactionDto) {
    return this.txService.simulate(req.user.userId, dto);
  }

  @Get()
  list(@Req() req: any, @Query() query: ListTransactionsDto) {
    return this.txService.list(req.user.userId, {
      cardId: query.cardId,
      merchantName: query.merchantName,
      category: query.category,
      startDate: query.startDate,
      endDate: query.endDate,
      minAmount: query.minAmount,
      maxAmount: query.maxAmount,
      search: query.search,
      status: query.status
    });
  }

  @Get('categories')
  getCategories() {
    const categories = this.categoryService.getCategories();
    return categories.map((cat) => ({
      name: cat,
      icon: this.categoryService.getCategoryIcon(cat),
      color: this.categoryService.getCategoryColor(cat)
    }));
  }
}






