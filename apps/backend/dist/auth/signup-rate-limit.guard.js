"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignupRateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
/**
 * Rate limit guard for signup
 * Prevents abuse by limiting signup attempts per IP and email
 */
let SignupRateLimitGuard = class SignupRateLimitGuard {
    constructor() {
        // In-memory store (use Redis in production)
        this.ipAttempts = new Map();
        this.emailAttempts = new Map();
        // Limits
        this.MAX_SIGNUPS_PER_IP_PER_HOUR = 3;
        this.MAX_SIGNUPS_PER_IP_PER_DAY = 10;
        this.MAX_SIGNUPS_PER_EMAIL_PER_DAY = 5;
        this.WINDOW_HOUR = 60 * 60 * 1000; // 1 hour
        this.WINDOW_DAY = 24 * 60 * 60 * 1000; // 24 hours
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
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
                    throw new common_1.HttpException(`Too many signup attempts from this IP. Maximum ${this.MAX_SIGNUPS_PER_IP_PER_HOUR} signups per hour.`, common_1.HttpStatus.TOO_MANY_REQUESTS);
                }
                ipHourAttempt.count++;
            }
            else {
                this.ipAttempts.set(ipHourKey, { count: 1, resetAt: now + this.WINDOW_HOUR });
            }
        }
        else {
            this.ipAttempts.set(ipHourKey, { count: 1, resetAt: now + this.WINDOW_HOUR });
        }
        // Check IP-based limits (daily)
        const ipDayKey = `ip:day:${ip}`;
        const ipDayAttempt = this.ipAttempts.get(ipDayKey);
        if (ipDayAttempt) {
            if (now < ipDayAttempt.resetAt) {
                if (ipDayAttempt.count >= this.MAX_SIGNUPS_PER_IP_PER_DAY) {
                    throw new common_1.HttpException(`Too many signup attempts from this IP. Maximum ${this.MAX_SIGNUPS_PER_IP_PER_DAY} signups per day.`, common_1.HttpStatus.TOO_MANY_REQUESTS);
                }
                ipDayAttempt.count++;
            }
            else {
                this.ipAttempts.set(ipDayKey, { count: 1, resetAt: now + this.WINDOW_DAY });
            }
        }
        else {
            this.ipAttempts.set(ipDayKey, { count: 1, resetAt: now + this.WINDOW_DAY });
        }
        // Check email-based limits (daily)
        const emailDayKey = `email:day:${email}`;
        const emailDayAttempt = this.emailAttempts.get(emailDayKey);
        if (emailDayAttempt) {
            if (now < emailDayAttempt.resetAt) {
                if (emailDayAttempt.count >= this.MAX_SIGNUPS_PER_EMAIL_PER_DAY) {
                    throw new common_1.HttpException(`Too many signup attempts for this email. Maximum ${this.MAX_SIGNUPS_PER_EMAIL_PER_DAY} attempts per day.`, common_1.HttpStatus.TOO_MANY_REQUESTS);
                }
                emailDayAttempt.count++;
            }
            else {
                this.emailAttempts.set(emailDayKey, { count: 1, resetAt: now + this.WINDOW_DAY });
            }
        }
        else {
            this.emailAttempts.set(emailDayKey, { count: 1, resetAt: now + this.WINDOW_DAY });
        }
        // Cleanup old entries periodically
        if (Math.random() < 0.01) {
            this.cleanup();
        }
        return true;
    }
    getClientIp(request) {
        return (request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            request.headers['x-real-ip'] ||
            request.ip ||
            request.socket.remoteAddress ||
            'unknown');
    }
    cleanup() {
        const now = Date.now();
        for (const [key, value] of [...this.ipAttempts.entries(), ...this.emailAttempts.entries()]) {
            if (now >= value.resetAt) {
                if (key.startsWith('ip:')) {
                    this.ipAttempts.delete(key);
                }
                else {
                    this.emailAttempts.delete(key);
                }
            }
        }
    }
};
exports.SignupRateLimitGuard = SignupRateLimitGuard;
exports.SignupRateLimitGuard = SignupRateLimitGuard = __decorate([
    (0, common_1.Injectable)()
], SignupRateLimitGuard);
//# sourceMappingURL=signup-rate-limit.guard.js.map