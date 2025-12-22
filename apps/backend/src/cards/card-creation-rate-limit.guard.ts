import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Rate limit guard for card creation
 * Prevents abuse by limiting card creation attempts
 */
@Injectable()
export class CardCreationRateLimitGuard implements CanActivate {
  // In-memory store (use Redis in production)
  private readonly attempts = new Map<string, { count: number; resetAt: number }>();
  
  // Limits
  private readonly MAX_CARDS_PER_HOUR = 5;
  private readonly MAX_CARDS_PER_DAY = 20;
  private readonly WINDOW_HOUR = 60 * 60 * 1000; // 1 hour
  private readonly WINDOW_DAY = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    
    if (!userId) {
      return true; // Let other guards handle auth
    }

    const now = Date.now();
    const hourKey = `hour:${userId}`;
    const dayKey = `day:${userId}`;

    // Check hourly limit
    const hourAttempt = this.attempts.get(hourKey);
    if (hourAttempt) {
      if (now < hourAttempt.resetAt) {
        if (hourAttempt.count >= this.MAX_CARDS_PER_HOUR) {
          throw new HttpException(
            `Too many card creation attempts. Maximum ${this.MAX_CARDS_PER_HOUR} cards per hour.`,
            HttpStatus.TOO_MANY_REQUESTS
          );
        }
        hourAttempt.count++;
      } else {
        // Reset window
        this.attempts.set(hourKey, { count: 1, resetAt: now + this.WINDOW_HOUR });
      }
    } else {
      this.attempts.set(hourKey, { count: 1, resetAt: now + this.WINDOW_HOUR });
    }

    // Check daily limit
    const dayAttempt = this.attempts.get(dayKey);
    if (dayAttempt) {
      if (now < dayAttempt.resetAt) {
        if (dayAttempt.count >= this.MAX_CARDS_PER_DAY) {
          throw new HttpException(
            `Too many card creation attempts. Maximum ${this.MAX_CARDS_PER_DAY} cards per day.`,
            HttpStatus.TOO_MANY_REQUESTS
          );
        }
        dayAttempt.count++;
      } else {
        // Reset window
        this.attempts.set(dayKey, { count: 1, resetAt: now + this.WINDOW_DAY });
      }
    } else {
      this.attempts.set(dayKey, { count: 1, resetAt: now + this.WINDOW_DAY });
    }

    // Cleanup old entries periodically (simple cleanup)
    if (Math.random() < 0.01) { // 1% chance to cleanup
      this.cleanup();
    }

    return true;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.attempts.entries()) {
      if (now >= value.resetAt) {
        this.attempts.delete(key);
      }
    }
  }
}

