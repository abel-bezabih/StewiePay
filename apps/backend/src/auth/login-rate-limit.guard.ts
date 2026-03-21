import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';

/**
 * Rate limit guard for login
 * Limits repeated attempts per IP and per email
 */
@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  private readonly ipAttempts = new Map<string, { count: number; resetAt: number }>();
  private readonly emailAttempts = new Map<string, { count: number; resetAt: number }>();

  private readonly MAX_LOGIN_PER_IP = 20;
  private readonly MAX_LOGIN_PER_EMAIL = 10;
  private readonly WINDOW_MS = 10 * 60 * 1000; // 10 minutes

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const email = request.body?.email?.toLowerCase();
    const ip = this.getClientIp(request);

    if (!ip) return true;
    const now = Date.now();

    const ipKey = `ip:${ip}`;
    const ipAttempt = this.ipAttempts.get(ipKey);
    if (ipAttempt) {
      if (now < ipAttempt.resetAt) {
        if (ipAttempt.count >= this.MAX_LOGIN_PER_IP) {
          throw new HttpException('Too many login attempts. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
        }
        ipAttempt.count++;
      } else {
        this.ipAttempts.set(ipKey, { count: 1, resetAt: now + this.WINDOW_MS });
      }
    } else {
      this.ipAttempts.set(ipKey, { count: 1, resetAt: now + this.WINDOW_MS });
    }

    if (email) {
      const emailKey = `email:${email}`;
      const emailAttempt = this.emailAttempts.get(emailKey);
      if (emailAttempt) {
        if (now < emailAttempt.resetAt) {
          if (emailAttempt.count >= this.MAX_LOGIN_PER_EMAIL) {
            throw new HttpException('Too many login attempts for this email. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
          }
          emailAttempt.count++;
        } else {
          this.emailAttempts.set(emailKey, { count: 1, resetAt: now + this.WINDOW_MS });
        }
      } else {
        this.emailAttempts.set(emailKey, { count: 1, resetAt: now + this.WINDOW_MS });
      }
    }

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
