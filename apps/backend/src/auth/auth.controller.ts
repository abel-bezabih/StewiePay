import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from './jwt.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignupRateLimitGuard } from './signup-rate-limit.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LoginRateLimitGuard } from './login-rate-limit.guard';
import { ForgotPasswordRateLimitGuard } from './forgot-password-rate-limit.guard';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private resolveBackendPublicUrl(req: any): string | undefined {
    const forwardedProto = req.headers?.['x-forwarded-proto'];
    const forwardedHost = req.headers?.['x-forwarded-host'];
    const host = forwardedHost || req.headers?.host;
    if (!host) return undefined;
    const protocol = forwardedProto || req.protocol || 'http';
    // Avoid emitting localhost links for real users clicking from email clients
    if (String(host).includes('localhost')) return undefined;
    return `${protocol}://${host}`;
  }

  @Post('signup')
  @UseGuards(SignupRateLimitGuard)
  signup(@Req() req: any, @Body() dto: CreateUserDto) {
    return this.authService.signup(dto, this.resolveBackendPublicUrl(req));
  }

  @Post('login')
  @UseGuards(LoginRateLimitGuard)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return this.authService.me(req.user.userId);
  }

  @Post('logout')
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('forgot-password')
  @UseGuards(ForgotPasswordRateLimitGuard)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Get('verify-email')
  verifyEmailGet(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @UseGuards(ForgotPasswordRateLimitGuard)
  resendVerification(@Req() req: any, @Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(dto.email, this.resolveBackendPublicUrl(req));
  }
}

