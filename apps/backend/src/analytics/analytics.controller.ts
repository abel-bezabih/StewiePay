import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AnalyticsService } from './analytics.service';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('spend-by-month')
  spendByMonth(@Req() req: any) {
    return this.analyticsService.spendByMonth(req.user.userId);
  }

  @Get('spend-by-category')
  spendByCategory(@Req() req: any) {
    return this.analyticsService.spendByCategory(req.user.userId);
  }

  @Get('category-trends')
  categoryTrends(@Req() req: any, @Query('months') months?: string) {
    return this.analyticsService.categoryTrends(
      req.user.userId,
      months ? parseInt(months, 10) : 6
    );
  }

  @Get('top-categories')
  topCategories(@Req() req: any, @Query('limit') limit?: string) {
    return this.analyticsService.topCategories(req.user.userId, limit ? parseInt(limit, 10) : 5);
  }

  @Get('insights')
  insights(@Req() req: any) {
    return this.analyticsService.spendingInsights(req.user.userId);
  }
}






