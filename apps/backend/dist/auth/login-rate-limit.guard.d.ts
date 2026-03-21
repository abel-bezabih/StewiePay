import { CanActivate, ExecutionContext } from '@nestjs/common';
/**
 * Rate limit guard for login
 * Limits repeated attempts per IP and per email
 */
export declare class LoginRateLimitGuard implements CanActivate {
    private readonly ipAttempts;
    private readonly emailAttempts;
    private readonly MAX_LOGIN_PER_IP;
    private readonly MAX_LOGIN_PER_EMAIL;
    private readonly WINDOW_MS;
    canActivate(context: ExecutionContext): boolean;
    private getClientIp;
    private cleanup;
}
