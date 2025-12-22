"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeWindowService = void 0;
const common_1 = require("@nestjs/common");
let TimeWindowService = class TimeWindowService {
    /**
     * Validates if a transaction is allowed based on card's time window restrictions
     * @param card The card with time window settings
     * @param transactionTime Optional transaction time (defaults to now)
     * @returns true if allowed, throws BadRequestException if blocked
     */
    assertTransactionAllowed(card, transactionTime = new Date()) {
        const timeWindow = this.parseTimeWindow(card);
        if (!timeWindow.enabled) {
            return true; // No time restrictions
        }
        // Check day of week
        if (timeWindow.daysOfWeek && timeWindow.daysOfWeek.length > 0) {
            const dayOfWeek = transactionTime.getDay();
            if (!timeWindow.daysOfWeek.includes(dayOfWeek)) {
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const allowedDays = timeWindow.daysOfWeek.map(d => dayNames[d]).join(', ');
                throw new common_1.BadRequestException(`Transaction not allowed on ${dayNames[dayOfWeek]}. Allowed days: ${allowedDays}`);
            }
        }
        // Check time of day
        if (timeWindow.startTime && timeWindow.endTime) {
            const currentTime = this.getTimeInTimezone(transactionTime, timeWindow.timezone);
            const [startHour, startMin] = timeWindow.startTime.split(':').map(Number);
            const [endHour, endMin] = timeWindow.endTime.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
            // Handle overnight time windows (e.g., 22:00 - 06:00)
            let isWithinWindow = false;
            if (startMinutes <= endMinutes) {
                // Normal time window (same day)
                isWithinWindow = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
            }
            else {
                // Overnight time window (spans midnight)
                isWithinWindow = currentMinutes >= startMinutes || currentMinutes <= endMinutes;
            }
            if (!isWithinWindow) {
                throw new common_1.BadRequestException(`Transaction not allowed at this time. Allowed hours: ${timeWindow.startTime} - ${timeWindow.endTime}`);
            }
        }
        return true;
    }
    /**
     * Parses time window from card's JSON fields
     */
    parseTimeWindow(card) {
        try {
            if (card.timeWindowEnabled === false || !card.timeWindowConfig) {
                return { enabled: false };
            }
            const config = typeof card.timeWindowConfig === 'string'
                ? JSON.parse(card.timeWindowConfig)
                : card.timeWindowConfig;
            return {
                enabled: card.timeWindowEnabled ?? false,
                daysOfWeek: config?.daysOfWeek,
                startTime: config?.startTime,
                endTime: config?.endTime,
                timezone: config?.timezone || 'Africa/Addis_Ababa'
            };
        }
        catch {
            return { enabled: false };
        }
    }
    /**
     * Gets time in specified timezone (simplified - in production, use a proper timezone library)
     */
    getTimeInTimezone(date, timezone) {
        // For now, return the date as-is
        // In production, use a library like date-fns-tz or moment-timezone
        return date;
    }
    /**
     * Validates time window configuration
     */
    validateTimeWindow(config) {
        if (!config.enabled) {
            return; // No validation needed if disabled
        }
        // Validate days of week
        if (config.daysOfWeek) {
            if (!Array.isArray(config.daysOfWeek)) {
                throw new common_1.BadRequestException('daysOfWeek must be an array');
            }
            if (config.daysOfWeek.some((d) => d < 0 || d > 6)) {
                throw new common_1.BadRequestException('daysOfWeek must contain values between 0 (Sunday) and 6 (Saturday)');
            }
        }
        // Validate time format
        if (config.startTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(config.startTime)) {
            throw new common_1.BadRequestException('startTime must be in HH:mm format (e.g., "09:00")');
        }
        if (config.endTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(config.endTime)) {
            throw new common_1.BadRequestException('endTime must be in HH:mm format (e.g., "17:00")');
        }
        // If both times are provided, validate logical order (unless overnight)
        if (config.startTime && config.endTime) {
            const [startHour, startMin] = config.startTime.split(':').map(Number);
            const [endHour, endMin] = config.endTime.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            // Allow overnight windows, but warn if they're too long (more than 12 hours)
            if (startMinutes > endMinutes) {
                const overnightDuration = (24 * 60 - startMinutes) + endMinutes;
                if (overnightDuration > 12 * 60) {
                    throw new common_1.BadRequestException('Overnight time window cannot exceed 12 hours');
                }
            }
            else if (endMinutes - startMinutes > 12 * 60) {
                throw new common_1.BadRequestException('Time window cannot exceed 12 hours');
            }
        }
    }
};
exports.TimeWindowService = TimeWindowService;
exports.TimeWindowService = TimeWindowService = __decorate([
    (0, common_1.Injectable)()
], TimeWindowService);
//# sourceMappingURL=time-window.service.js.map