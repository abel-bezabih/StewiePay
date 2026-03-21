import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UploadAvatarDto } from './dto/upload-avatar.dto';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { UpdateKycStatusDto } from './dto/update-kyc-status.dto';
import { ListKycReviewsDto } from './dto/list-kyc-reviews.dto';
import type { Response } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: any) {
    return this.usersService.findById(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.userId, dto.currentPassword, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-avatar')
  uploadAvatar(@Req() req: any, @Body() dto: UploadAvatarDto) {
    return this.usersService.uploadAvatar(req.user.userId, dto.image);
  }

  @UseGuards(JwtAuthGuard)
  @Post('kyc/submit')
  submitKyc(@Req() req: any, @Body() dto: SubmitKycDto) {
    return this.usersService.submitKyc(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('kyc/status')
  getKycStatus(@Req() req: any) {
    return this.usersService.getKycStatus(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('kyc/submissions')
  listKycSubmissions(@Req() req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.usersService.listKycSubmissions();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('kyc/:userId/status')
  updateKycStatus(@Req() req: any, @Param('userId') userId: string, @Body() dto: UpdateKycStatusDto) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.usersService.updateKycStatus(userId, dto, {
      reviewerId: req.user.userId,
      reviewerIp: req.ip,
      reviewerUserAgent: req.headers?.['user-agent']
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('kyc/reviews/export.csv')
  async exportAllKycReviewsCsv(@Req() req: any, @Query() query: ListKycReviewsDto, @Res() res: Response) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    const csv = await this.usersService.exportAllKycReviewsCsv({
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
      reviewerEmail: query.reviewerEmail,
      subjectEmail: query.subjectEmail
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="kyc-reviews-all-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.status(200).send(csv);
  }

  @UseGuards(JwtAuthGuard)
  @Get('kyc/:userId/reviews')
  listKycReviews(@Req() req: any, @Param('userId') userId: string, @Query() query: ListKycReviewsDto) {
    const isAdmin = req.user.role === 'ADMIN';
    const isSelf = req.user.userId === userId;
    if (!isAdmin && !isSelf) {
      throw new ForbiddenException('Not allowed to view this review history');
    }
    return this.usersService.listKycReviews(userId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('kyc/:userId/reviews/export.csv')
  async exportKycReviewsCsv(
    @Req() req: any,
    @Param('userId') userId: string,
    @Query() query: ListKycReviewsDto,
    @Res() res: Response
  ) {
    const isAdmin = req.user.role === 'ADMIN';
    const isSelf = req.user.userId === userId;
    if (!isAdmin && !isSelf) {
      throw new ForbiddenException('Not allowed to export this review history');
    }

    const csv = await this.usersService.exportKycReviewsCsv(userId, {
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
      reviewerEmail: query.reviewerEmail
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="kyc-reviews-${userId}.csv"`);
    res.status(200).send(csv);
  }
}

