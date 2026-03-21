import { Injectable, UnauthorizedException, BadRequestException, HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/user.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RefreshTokenService } from './refresh-token.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private refreshTokens: RefreshTokenService,
    private emailService: EmailService,
  ) {}

  private getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (secret) return secret;
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production');
    }
    return 'dev-secret';
  }

  /**
   * Enhanced signup with security checks
   */
  async signup(dto: CreateUserDto, backendPublicUrlOverride?: string) {
    // Additional security validations
    this.validateSignupData(dto);

    // Check if email already exists (double-check before creation)
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    // Create user
    const user = await this.usersService.create(dto);

    const verificationToken = this.signEmailVerificationToken(user.id, user.email);
    try {
      await this.emailService.sendEmailVerificationEmail(
        user.email,
        verificationToken,
        user.name,
        backendPublicUrlOverride
      );
    } catch (error) {
      // In development, don't block signup if email provider is not configured
      if (process.env.NODE_ENV !== 'development') {
        throw error;
      }
    }

    // TODO: Log signup event for audit
    // await this.auditLogService.log({
    //   userId: user.id,
    //   action: 'USER_SIGNUP',
    //   metadata: { email: user.email, role: user.role }
    // });

    return {
      user,
      requiresEmailVerification: true,
      message: 'Account created. Please verify your email before signing in.',
      ...(process.env.NODE_ENV === 'development' ? { verificationToken } : {})
    };
  }

  /**
   * Validate signup data for security
   */
  private validateSignupData(dto: CreateUserDto) {
    // Check for common disposable email domains (can be expanded)
    const disposableDomains = [
      'tempmail.com',
      'guerrillamail.com',
      'mailinator.com',
      '10minutemail.com'
    ];
    const emailDomain = dto.email.split('@')[1]?.toLowerCase();
    if (disposableDomains.includes(emailDomain)) {
      throw new BadRequestException('Disposable email addresses are not allowed');
    }

    // Check for suspicious patterns in name
    if (dto.name.trim().length < 2) {
      throw new BadRequestException('Name must be at least 2 characters');
    }

    // Check for common weak passwords
    const weakPasswords = ['password', '12345678', 'password123', 'qwerty123'];
    if (weakPasswords.includes(dto.password.toLowerCase())) {
      throw new BadRequestException('Password is too weak. Please choose a stronger password.');
    }

    // Validate phone format if provided
    if (dto.phone) {
      // Remove all non-digit characters for validation
      const phoneDigits = dto.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10 || phoneDigits.length > 15) {
        throw new BadRequestException('Invalid phone number format');
      }
    }
  }

  async login(dto: LoginDto) {
    try {
      const user = await this.usersService.validateUser(dto.email, dto.password);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.emailVerified && !user.email.endsWith('.local')) {
        throw new UnauthorizedException('Please verify your email before signing in');
      }

      // TODO: Check if account is suspended/disabled
      // if (user.status === 'SUSPENDED') {
      //   throw new UnauthorizedException('Account has been suspended');
      // }

      // TODO: Check if email is verified (optional for MVP)
      // if (!user.emailVerified) {
      //   throw new UnauthorizedException('Please verify your email before logging in');
      // }

      const tokens = await this.issueTokens(user.id, user.email, user.role);
      return {
        user,
        ...tokens
      };
    } catch (error: any) {
      console.error('Login error:', error);
      if (error instanceof UnauthorizedException || error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`Login failed: ${error.message || 'Unknown error'}`);
    }
  }

  private signEmailVerificationToken(userId: string, email: string) {
    return this.jwtService.sign(
      { sub: userId, email, type: 'email-verify' },
      {
        expiresIn: '24h',
        secret: this.getJwtSecret()
      }
    );
  }

  async verifyEmail(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.getJwtSecret()
      });
      if (payload.type !== 'email-verify') {
        throw new BadRequestException('Invalid verification token');
      }
      const user = await this.usersService.findByEmail(payload.email);
      if (!user) {
        throw new BadRequestException('User not found');
      }
      if (user.emailVerified) {
        return { message: 'Email already verified' };
      }
      await this.usersService.markEmailVerified(user.id);
      return { message: 'Email verified successfully' };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Verification link has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid verification token');
      }
      throw error;
    }
  }

  async resendVerificationEmail(email: string, backendPublicUrlOverride?: string) {
    const user = await this.usersService.findByEmail(email);
    // Do not reveal existence for security
    if (!user) {
      return { message: 'If an account exists, a verification email has been sent.' };
    }
    if (user.emailVerified) {
      return { message: 'Email is already verified.' };
    }

    const verificationToken = this.signEmailVerificationToken(user.id, user.email);
    try {
      await this.emailService.sendEmailVerificationEmail(
        user.email,
        verificationToken,
        user.name,
        backendPublicUrlOverride
      );
    } catch (error) {
      if (process.env.NODE_ENV !== 'development') {
        throw error;
      }
    }
    return {
      message: 'Verification email sent. Please check your inbox.',
      ...(process.env.NODE_ENV === 'development' ? { verificationToken } : {})
    };
  }

  private signToken(sub: string, email: string, role: string) {
    return this.jwtService.sign(
      { sub, email, role },
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        secret: this.getJwtSecret()
      }
    );
  }

  private async issueTokens(sub: string, email: string, role: string) {
    try {
      const token = this.signToken(sub, email, role);
      const refreshToken = await this.refreshTokens.generate(sub);
      return { token, refreshToken };
    } catch (error: any) {
      console.error('Error issuing tokens:', error);
      throw new BadRequestException(
        `Failed to generate tokens: ${error.message || 'Unknown error'}`
      );
    }
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  async refresh(dto: RefreshTokenDto) {
    const { userId, refreshToken } = await this.refreshTokens.rotate(dto.refreshToken);
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Invalid refresh token');
    const token = this.signToken(user.id, user.email, user.role);
    return { user, token, refreshToken };
  }

  async logout(refreshToken: string) {
    await this.refreshTokens.revoke(refreshToken);
    return { success: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Don't reveal if email exists for security
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // Generate a short-lived JWT token for password reset (1 hour)
    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email, type: 'password-reset' },
      {
        expiresIn: '1h',
        secret: this.getJwtSecret()
      }
    );

    // Send password reset email
    try {
      await this.emailService.sendPasswordResetEmail(user.email, resetToken, user.name || undefined);
      
      // In development, also return the token for testing
      if (process.env.NODE_ENV === 'development') {
        return {
          message: 'Password reset email sent. Check your inbox (or see resetToken below for testing).',
          resetToken // Only in dev mode for testing
        };
      }
    } catch (error: any) {
      // Log error but don't reveal to user (security best practice)
      console.error('[AuthService] Failed to send password reset email:', error.message);
      // Still return success message to user (don't reveal if email exists)
    }

    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    try {
      // Verify and decode the reset token
      const payload = this.jwtService.verify(dto.token, {
        secret: this.getJwtSecret()
      });

      // Check if token is a password reset token
      if (payload.type !== 'password-reset') {
        throw new BadRequestException('Invalid reset token');
      }

      // Update password
      await this.usersService.updatePasswordByEmail(payload.email, dto.newPassword);

      return { message: 'Password has been reset successfully. You can now login with your new password.' };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Reset token has expired. Please request a new one.');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid reset token');
      }
      throw error;
    }
  }
}
