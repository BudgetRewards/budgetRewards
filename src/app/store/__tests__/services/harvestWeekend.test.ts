import { describe, test, expect } from 'vitest';
import { weekendFor, isWeekendEarned, weekendLabels } from '../../services/harvestWeekend';
import type { UsageRecord } from '../../types';

function rec(date: string, consumption: number, production: number): UsageRecord {
  return {
    date,
    generatedAt: '',
    hasHomeBattery: false,
    hours: Array.from({ length: 24 }, (_, hour) => ({ hour, consumption, production })),
  };
}

describe('weekendFor', () => {
  test('Saturday and Sunday map to the same weekend', () => {
    const fromSat = weekendFor('2026-05-02'); // Saturday
    const fromSun = weekendFor('2026-05-03'); // Sunday
    expect(fromSat).toEqual({ id: '2026-05-02', sat: '2026-05-02', sun: '2026-05-03' });
    expect(fromSun).toEqual(fromSat);
  });

  test('weekdays return null', () => {
    expect(weekendFor('2026-05-04')).toBeNull(); // Monday
  });
});

describe('isWeekendEarned', () => {
  const weekend = weekendFor('2026-05-02')!;

  test('true only when both days earned green hours', () => {
    const usages = { '2026-05-02': rec('2026-05-02', 2, 1), '2026-05-03': rec('2026-05-03', 2, 1) };
    expect(isWeekendEarned(weekend, usages)).toBe(true);
  });

  test('false when one day is missing', () => {
    expect(isWeekendEarned(weekend, { '2026-05-02': rec('2026-05-02', 2, 1) })).toBe(false);
  });

  test('false when one day missed (production >= consumption)', () => {
    const usages = { '2026-05-02': rec('2026-05-02', 2, 1), '2026-05-03': rec('2026-05-03', 1, 2) };
    expect(isWeekendEarned(weekend, usages)).toBe(false);
  });
});

describe('weekendLabels', () => {
  test('formats a same-month weekend', () => {
    expect(weekendLabels(weekendFor('2026-05-02')!)).toEqual({ nl: '2–3 mei', en: '2–3 May' });
  });
});
