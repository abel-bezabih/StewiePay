import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
/**
 * Rate limit guard for card creation
 * Prevents abuse by limiting card creation attempts
 */
export declare class CardCreationRateLimitGuard implements CanActivate {
    private reflector;
    private readonly attempts;
    private readonly MAX_CARDS_PER_HOUR;
    private readonly MAX_CARDS_PER_DAY;
    private readonly WINDOW_HOUR;
    private readonly WINDOW_DAY;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
    private cleanup;
}
