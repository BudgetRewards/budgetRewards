import type { HourlyUsage } from './usageSimulator';

/** Green hours run from 12:00 to 17:00 (i.e. hours 12, 13, 14, 15, 16). */
export const GREEN_HOURS_START = 12;
export const GREEN_HOURS_END = 17; // exclusive

/** Sum consumption and production across the 12:00–17:00 window. */
export function greenHoursTotals(hours: HourlyUsage[]): { consumption: number; production: number } {
  return hours.reduce(
    (acc, h) => {
      if (h.hour >= GREEN_HOURS_START && h.hour < GREEN_HOURS_END) {
        acc.consumption += h.consumption;
        acc.production += h.production;
      }
      return acc;
    },
    { consumption: 0, production: 0 },
  );
}

/**
 * A green-hours day is "earned" when, during 12:00–17:00, the customer
 * consumed more than they produced — i.e. they soaked up the surplus.
 * Returns true (earned) or false (missed).
 */
export function isGreenHoursEarned(hours: HourlyUsage[]): boolean {
  const { consumption, production } = greenHoursTotals(hours);
  return consumption > production;
}
