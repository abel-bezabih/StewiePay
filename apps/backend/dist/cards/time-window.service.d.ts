import { Card } from '@prisma/client';
export interface TimeWindow {
    enabled: boolean;
    daysOfWeek?: number[];
    startTime?: string;
    endTime?: string;
    timezone?: string;
}
export declare class TimeWindowService {
    /**
     * Validates if a transaction is allowed based on card's time window restrictions
     * @param card The card with time window settings
     * @param transactionTime Optional transaction time (defaults to now)
     * @returns true if allowed, throws BadRequestException if blocked
     */
    assertTransactionAllowed(card: Card, transactionTime?: Date): boolean;
    /**
     * Parses time window from card's JSON fields
     */
    private parseTimeWindow;
    /**
     * Gets time in specified timezone (simplified - in production, use a proper timezone library)
     */
    private getTimeInTimezone;
    /**
     * Validates time window configuration
     */
    validateTimeWindow(config: Partial<TimeWindow>): void;
}
