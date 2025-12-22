"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardCreationRateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
/**
 * Rate limit guard for card creation
 * Prevents abuse by limiting card creation attempts
 */
let CardCreationRateLimitGuard = class CardCreationRateLimitGuard {
    constructor(reflector) {
        this.reflector = reflector;
        // In-memory store (use Redis in production)
        this.attempts = new Map();
        // Limits
        this.MAX_CARDS_PER_HOUR = 5;
        this.MAX_CARDS_PER_DAY = 20;
        this.WINDOW_HOUR = 60 * 60 * 1000; // 1 hour
        this.WINDOW_DAY = 24 * 60 * 60 * 1000; // 24 hours
    }
    canActivate(context) {
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
                    throw new common_1.HttpException(`Too many card creation attempts. Maximum ${this.MAX_CARDS_PER_HOUR} cards per hour.`, common_1.HttpStatus.TOO_MANY_REQUESTS);
                }
                hourAttempt.count++;
            }
            else {
                // Reset window
                this.attempts.set(hourKey, { count: 1, resetAt: now + this.WINDOW_HOUR });
            }
        }
        else {
            this.attempts.set(hourKey, { count: 1, resetAt: now + this.WINDOW_HOUR });
        }
        // Check daily limit
        const dayAttempt = this.attempts.get(dayKey);
        if (dayAttempt) {
            if (now < dayAttempt.resetAt) {
                if (dayAttempt.count >= this.MAX_CARDS_PER_DAY) {
                    throw new common_1.HttpException(`Too many card creation attempts. Maximum ${this.MAX_CARDS_PER_DAY} cards per day.`, common_1.HttpStatus.TOO_MANY_REQUESTS);
                }
                dayAttempt.count++;
            }
            else {
                // Reset window
                this.attempts.set(dayKey, { count: 1, resetAt: now + this.WINDOW_DAY });
            }
        }
        else {
            this.attempts.set(dayKey, { count: 1, resetAt: now + this.WINDOW_DAY });
        }
        // Cleanup old entries periodically (simple cleanup)
        if (Math.random() < 0.01) { // 1% chance to cleanup
            this.cleanup();
        }
        return true;
    }
    cleanup() {
        const now = Date.now();
        for (const [key, value] of this.attempts.entries()) {
            if (now >= value.resetAt) {
                this.attempts.delete(key);
            }
        }
    }
};
exports.CardCreationRateLimitGuard = CardCreationRateLimitGuard;
exports.CardCreationRateLimitGuard = CardCreationRateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], CardCreationRateLimitGuard);
//# sourceMappingURL=card-creation-rate-limit.guard.js.map