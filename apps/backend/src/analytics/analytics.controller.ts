import { Controller, Get, Req, UseGuards } from '@nestjs/common';
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

}






