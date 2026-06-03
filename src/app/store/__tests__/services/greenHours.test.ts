import { describe, test, expect } from 'vitest';
import { isGreenHoursEarned, greenHoursTotals } from '../../services/greenHours';
import type { HourlyUsage } from '../../services/usageSimulator';

/** Build a 24-hour array with fixed consumption/production per hour. */
function hours(consumption: number, production: number): HourlyUsage[] {
  return Array.from({ length: 24 }, (_, hour) => ({ hour, consumption, production }));
}

describe('greenHours', () => {
  test('only sums the 12:00–17:00 window', () => {
    const totals = greenHoursTotals(hours(1, 0));
    expect(totals.consumption).toBe(5); // hours 12,13,14,15,16
    expect(totals.production).toBe(0);
  });

  test('earned when consumption exceeds production in the window', () => {
    expect(isGreenHoursEarned(hours(2, 1))).toBe(true);
  });

  test('missed when production meets or exceeds consumption', () => {
    expect(isGreenHoursEarned(hours(1, 1))).toBe(false);
    expect(isGreenHoursEarned(hours(1, 2))).toBe(false);
  });

  test('ignores consumption outside the window', () => {
    const data = hours(0, 0).map(h =>
      h.hour < 12 ? { ...h, consumption: 100 } : { ...h, consumption: 0, production: 1 },
    );
    expect(isGreenHoursEarned(data)).toBe(false);
  });
});
