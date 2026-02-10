import { Obligation } from '../types';

/**
 * Calculate the number of days between two dates
 */
export function daysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayString(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Check if an obligation is upcoming (due within specified days and not paid)
 */
export function isUpcoming(obligation: Obligation, daysAhead: number = 3): boolean {
    if (obligation.isPaid) return false;

    const today = getTodayString();
    const daysUntilDue = daysBetween(today, obligation.dueDate);

    // Upcoming: due in 0 to daysAhead days (not overdue, not paid)
    return daysUntilDue >= 0 && daysUntilDue <= daysAhead;
}

/**
 * Check if an obligation is overdue
 */
export function isOverdue(obligation: Obligation): boolean {
    if (obligation.isPaid) return false;

    const today = getTodayString();
    return obligation.dueDate < today;
}

/**
 * Get all upcoming obligations (due within daysAhead)
 */
export function getUpcomingObligations(obligations: Obligation[], daysAhead: number = 3): Obligation[] {
    return obligations.filter(o => isUpcoming(o, daysAhead));
}

/**
 * Sort obligations by due date (soonest first)
 */
export function sortByDueDate(obligations: Obligation[]): Obligation[] {
    return [...obligations].sort((a, b) => {
        if (a.dueDate < b.dueDate) return -1;
        if (a.dueDate > b.dueDate) return 1;
        return 0;
    });
}
