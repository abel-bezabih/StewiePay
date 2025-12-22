import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';

/**
 * Rate limit guard for signup
 * Prevents abuse by limiting signup attempts per IP and email
 */
@Injectable()
export class SignupRateLimitGuard implements CanActivate {
  // In-memory store (use Redis in production)
  private readonly ipAttempts = new Map<string, { count: number; resetAt: number }>();
  private readonly emailAttempts = new Map<string, { count: number; resetAt: number }>();
  
  // Limits
  private readonly MAX_SIGNUPS_PER_IP_PER_HOUR = 3;
  private readonly MAX_SIGNUPS_PER_IP_PER_DAY = 10;
  private readonly MAX_SIGNUPS_PER_EMAIL_PER_DAY = 5;
  private readonly WINDOW_HOUR = 60 * 60 * 1000; // 1 hour
  private readonly WINDOW_DAY = 24 * 60 * 60 * 1000; // 24 hours

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const email = request.body?.email?.toLowerCase();
    const ip = this.getClientIp(request);
    
    if (!email || !ip) {
      return true; // Let validation handle missing fields
    }

    const now = Date.now();

    // Check IP-based limits (hourly)
    const ipHourKey = `ip:hour:${ip}`;
    const ipHourAttempt = this.ipAttempts.get(ipHourKey);
    if (ipHourAttempt) {
      if (now < ipHourAttempt.resetAt) {
        if (ipHourAttempt.count >= this.MAX_SIGNUPS_PER_IP_PER_HOUR) {
          throw new HttpException(
            `Too many signup attempts from this IP. Maximum ${this.MAX_SIGNUPS_PER_IP_PER_HOUR} signups per hour.`,
            HttpStatus.TOO_MANY_REQUESTS
          );
        }
        ipHourAttempt.count++;
      } else {
        this.ipAttempts.set(ipHourKey, { count: 1, resetAt: now + this.WINDOW_HOUR });
      }
    } else {
      this.ipAttempts.set(ipHourKey, { count: 1, resetAt: now + this.WINDOW_HOUR });
    }

    // Check IP-based limits (daily)
    const ipDayKey = `ip:day:${ip}`;
    const ipDayAttempt = this.ipAttempts.get(ipDayKey);
    if (ipDayAttempt) {
      if (now < ipDayAttempt.resetAt) {
        if (ipDayAttempt.count >= this.MAX_SIGNUPS_PER_IP_PER_DAY) {
          throw new HttpException(
            `Too many signup attempts from this IP. Maximum ${this.MAX_SIGNUPS_PER_IP_PER_DAY} signups per day.`,
            HttpStatus.TOO_MANY_REQUESTS
          );
        }
        ipDayAttempt.count++;
      } else {
        this.ipAttempts.set(ipDayKey, { count: 1, resetAt: now + this.WINDOW_DAY });
      }
    } else {
      this.ipAttempts.set(ipDayKey, { count: 1, resetAt: now + this.WINDOW_DAY });
    }

    // Check email-based limits (daily)
    const emailDayKey = `email:day:${email}`;
    const emailDayAttempt = this.emailAttempts.get(emailDayKey);
    if (emailDayAttempt) {
      if (now < emailDayAttempt.resetAt) {
        if (emailDayAttempt.count >= this.MAX_SIGNUPS_PER_EMAIL_PER_DAY) {
          throw new HttpException(
            `Too many signup attempts for this email. Maximum ${this.MAX_SIGNUPS_PER_EMAIL_PER_DAY} attempts per day.`,
            HttpStatus.TOO_MANY_REQUESTS
          );
        }
        emailDayAttempt.count++;
      } else {
        this.emailAttempts.set(emailDayKey, { count: 1, resetAt: now + this.WINDOW_DAY });
      }
    } else {
      this.emailAttempts.set(emailDayKey, { count: 1, resetAt: now + this.WINDOW_DAY });
    }

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    return true;
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (request.headers['x-real-ip'] as string) ||
      request.ip ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of [...this.ipAttempts.entries(), ...this.emailAttempts.entries()]) {
      if (now >= value.resetAt) {
        if (key.startsWith('ip:')) {
          this.ipAttempts.delete(key);
        } else {
          this.emailAttempts.delete(key);
        }
      }
    }
  }
}

