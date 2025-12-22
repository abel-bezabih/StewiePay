import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { BudgetService, BudgetProgress } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateBudgetDto) {
    return this.budgetService.create(req.user.userId, dto);
  }

  @Get()
  list(@Req() req: any) {
    return this.budgetService.list(req.user.userId);
  }

  @Get('progress')
  getProgress(@Req() req: any): Promise<BudgetProgress[]> {
    return this.budgetService.getBudgetProgress(req.user.userId);
  }

  @Get(':id')
  getById(@Req() req: any, @Param('id') id: string) {
    return this.budgetService.getById(req.user.userId, id);
  }

  @Get(':id/progress')
  getProgressById(@Req() req: any, @Param('id') id: string): Promise<BudgetProgress[]> {
    return this.budgetService.getBudgetProgress(req.user.userId, id);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateBudgetDto) {
    return this.budgetService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  delete(@Req() req: any, @Param('id') id: string) {
    return this.budgetService.delete(req.user.userId, id);
  }
}

