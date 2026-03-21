"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginRateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
/**
 * Rate limit guard for login
 * Limits repeated attempts per IP and per email
 */
let LoginRateLimitGuard = class LoginRateLimitGuard {
    constructor() {
        this.ipAttempts = new Map();
        this.emailAttempts = new Map();
        this.MAX_LOGIN_PER_IP = 20;
        this.MAX_LOGIN_PER_EMAIL = 10;
        this.WINDOW_MS = 10 * 60 * 1000; // 10 minutes
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const email = request.body?.email?.toLowerCase();
        const ip = this.getClientIp(request);
        if (!ip)
            return true;
        const now = Date.now();
        const ipKey = `ip:${ip}`;
        const ipAttempt = this.ipAttempts.get(ipKey);
        if (ipAttempt) {
            if (now < ipAttempt.resetAt) {
                if (ipAttempt.count >= this.MAX_LOGIN_PER_IP) {
                    throw new common_1.HttpException('Too many login attempts. Try again later.', common_1.HttpStatus.TOO_MANY_REQUESTS);
                }
                ipAttempt.count++;
            }
            else {
                this.ipAttempts.set(ipKey, { count: 1, resetAt: now + this.WINDOW_MS });
            }
        }
        else {
            this.ipAttempts.set(ipKey, { count: 1, resetAt: now + this.WINDOW_MS });
        }
        if (email) {
            const emailKey = `email:${email}`;
            const emailAttempt = this.emailAttempts.get(emailKey);
            if (emailAttempt) {
                if (now < emailAttempt.resetAt) {
                    if (emailAttempt.count >= this.MAX_LOGIN_PER_EMAIL) {
                        throw new common_1.HttpException('Too many login attempts for this email. Try again later.', common_1.HttpStatus.TOO_MANY_REQUESTS);
                    }
                    emailAttempt.count++;
                }
                else {
                    this.emailAttempts.set(emailKey, { count: 1, resetAt: now + this.WINDOW_MS });
                }
            }
            else {
                this.emailAttempts.set(emailKey, { count: 1, resetAt: now + this.WINDOW_MS });
            }
        }
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
exports.LoginRateLimitGuard = LoginRateLimitGuard;
exports.LoginRateLimitGuard = LoginRateLimitGuard = __decorate([
    (0, common_1.Injectable)()
], LoginRateLimitGuard);
//# sourceMappingURL=login-rate-limit.guard.js.map