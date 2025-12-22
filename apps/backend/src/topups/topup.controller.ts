import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TopUpService } from './topup.service';
import { InitiateTopUpDto } from './dto/initiate-topup.dto';
import { VerifyTopUpDto } from './dto/verify-topup.dto';

@UseGuards(JwtAuthGuard)
@Controller('topups')
export class TopUpController {
  constructor(private readonly topupService: TopUpService) {}

  @Post('initiate')
  initiate(@Req() req: any, @Body() dto: InitiateTopUpDto) {
    return this.topupService.initiate(req.user.userId, dto);
  }

  @Post('verify')
  verify(@Req() req: any, @Body() dto: VerifyTopUpDto) {
    return this.topupService.verify(req.user.userId, dto.topUpId);
  }

  @Get()
  list(@Req() req: any) {
    return this.topupService.list(req.user.userId);
  }
}












