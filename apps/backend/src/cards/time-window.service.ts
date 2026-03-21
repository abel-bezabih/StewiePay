import { BadRequestException, Injectable } from '@nestjs/common';
import { Card } from '@prisma/client';

export interface TimeWindow {
  enabled: boolean;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime?: string; // HH:mm format (e.g., "09:00")
  endTime?: string; // HH:mm format (e.g., "17:00")
  timezone?: string; // e.g., "Africa/Addis_Ababa"
}

@Injectable()
export class TimeWindowService {
  /**
   * Validates if a transaction is allowed based on card's time window restrictions
   * @param card The card with time window settings
   * @param transactionTime Optional transaction time (defaults to now)
   * @returns true if allowed, throws BadRequestException if blocked
   */
  assertTransactionAllowed(
    card: Card,
    transactionTime: Date = new Date()
  ): boolean {
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
        throw new BadRequestException(
          `Transaction not allowed on ${dayNames[dayOfWeek]}. Allowed days: ${allowedDays}`
        );
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
      } else {
        // Overnight time window (spans midnight)
        isWithinWindow = currentMinutes >= startMinutes || currentMinutes <= endMinutes;
      }

      if (!isWithinWindow) {
        throw new BadRequestException(
          `Transaction not allowed at this time. Allowed hours: ${timeWindow.startTime} - ${timeWindow.endTime}`
        );
      }
    }

    return true;
  }

  /**
   * Parses time window from card's JSON fields
   */
  private parseTimeWindow(card: Card): TimeWindow {
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
    } catch {
      return { enabled: false };
    }
  }

  /**
   * Gets time in specified timezone (simplified - in production, use a proper timezone library)
   */
  private getTimeInTimezone(date: Date, timezone?: string): Date {
    // For now, return the date as-is
    // In production, use a library like date-fns-tz or moment-timezone
    return date;
  }

  /**
   * Validates time window configuration
   */
  validateTimeWindow(config: Partial<TimeWindow>): void {
    if (!config.enabled) {
      return; // No validation needed if disabled
    }

    // Validate days of week
    if (config.daysOfWeek) {
      if (!Array.isArray(config.daysOfWeek)) {
        throw new BadRequestException('daysOfWeek must be an array');
      }
      if (config.daysOfWeek.some((d) => d < 0 || d > 6)) {
        throw new BadRequestException('daysOfWeek must contain values between 0 (Sunday) and 6 (Saturday)');
      }
    }

    // Validate time format
    if (config.startTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(config.startTime)) {
      throw new BadRequestException('startTime must be in HH:mm format (e.g., "09:00")');
    }
    if (config.endTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(config.endTime)) {
      throw new BadRequestException('endTime must be in HH:mm format (e.g., "17:00")');
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
          throw new BadRequestException('Overnight time window cannot exceed 12 hours');
        }
      } else if (endMinutes - startMinutes > 12 * 60) {
        throw new BadRequestException('Time window cannot exceed 12 hours');
      }
    }
  }
}















