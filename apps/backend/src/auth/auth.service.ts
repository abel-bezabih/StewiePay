import { Injectable, UnauthorizedException, BadRequestException, HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/user.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RefreshTokenService } from './refresh-token.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private refreshTokens: RefreshTokenService
  ) {}

  /**
   * Enhanced signup with security checks
   */
  async signup(dto: CreateUserDto) {
    // Additional security validations
    this.validateSignupData(dto);

    // Check if email already exists (double-check before creation)
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    // Create user
    const user = await this.usersService.create(dto);

    // Issue tokens
    const tokens = await this.issueTokens(user.id, user.email, user.role);

    // TODO: Send email verification
    // await this.emailService.sendVerificationEmail(user.email, user.id);

    // TODO: Log signup event for audit
    // await this.auditLogService.log({
    //   userId: user.id,
    //   action: 'USER_SIGNUP',
    //   metadata: { email: user.email, role: user.role }
    // });

    return {
      user,
      ...tokens,
      message: 'Account created successfully. Please verify your email to continue.'
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

  private signToken(sub: string, email: string, role: string) {
    return this.jwtService.sign(
      { sub, email, role },
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        secret: process.env.JWT_SECRET || 'dev-secret'
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
}
