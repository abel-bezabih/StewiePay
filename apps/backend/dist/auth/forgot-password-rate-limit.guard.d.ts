import { CanActivate, ExecutionContext } from '@nestjs/common';
/**
 * Rate limit guard for forgot password
 * Limits attempts per IP and per email to reduce abuse
 */
export declare class ForgotPasswordRateLimitGuard implements CanActivate {
    private readonly ipAttempts;
    private readonly emailAttempts;
    private readonly MAX_PER_IP;
    private readonly MAX_PER_EMAIL;
    private readonly WINDOW_MS;
    canActivate(context: ExecutionContext): boolean;
    private getClientIp;
    private cleanup;
}
