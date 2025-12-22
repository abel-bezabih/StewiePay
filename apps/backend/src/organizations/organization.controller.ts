import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { OrganizationsService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';

@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateOrganizationDto) {
    return this.orgsService.create(req.user.userId, dto);
  }

  @Get()
  list(@Req() req: any) {
    return this.orgsService.listForUser(req.user.userId);
  }

  @Post(':id/members')
  addMember(@Req() req: any, @Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.orgsService.addMember(id, req.user.userId, dto);
  }
}












