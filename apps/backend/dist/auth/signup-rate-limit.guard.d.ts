import { CanActivate, ExecutionContext } from '@nestjs/common';
/**
 * Rate limit guard for signup
 * Prevents abuse by limiting signup attempts per IP and email
 */
export declare class SignupRateLimitGuard implements CanActivate {
    private readonly ipAttempts;
    private readonly emailAttempts;
    private readonly MAX_SIGNUPS_PER_IP_PER_HOUR;
    private readonly MAX_SIGNUPS_PER_IP_PER_DAY;
    private readonly MAX_SIGNUPS_PER_EMAIL_PER_DAY;
    private readonly WINDOW_HOUR;
    private readonly WINDOW_DAY;
    canActivate(context: ExecutionContext): boolean;
    private getClientIp;
    private cleanup;
}
