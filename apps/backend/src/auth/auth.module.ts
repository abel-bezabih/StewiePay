import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/user.module';
import { JwtStrategy } from './jwt.strategy';
import { RefreshTokenService } from './refresh-token.service';
import { SignupRateLimitGuard } from './signup-rate-limit.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { LoginRateLimitGuard } from './login-rate-limit.guard';
import { ForgotPasswordRateLimitGuard } from './forgot-password-rate-limit.guard';

const resolveJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return 'dev-secret';
};

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    EmailModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: resolveJwtSecret(),
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      })
    })
  ],
  providers: [
    AuthService,
    JwtStrategy,
    RefreshTokenService,
    SignupRateLimitGuard,
    LoginRateLimitGuard,
    ForgotPasswordRateLimitGuard
  ],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {}

