import { describe, test, expect } from 'vitest';
import { simulateDailyUsage } from '../../services/usageSimulator';

const sum = (hours: { production: number }[], key: 'production' | 'consumption') =>
  hours.reduce((s, h) => s + (h as any)[key], 0);

describe('simulateDailyUsage', () => {
  test('consumption sums to roughly the daily target', () => {
    const hours = simulateDailyUsage({ dailyTargetKwh: 10 });
    const total = sum(hours as any, 'consumption');
    expect(total).toBeGreaterThan(8.5);
    expect(total).toBeLessThan(11.5);
  });

  test('no solar → zero production all day', () => {
    const hours = simulateDailyUsage({ dailyTargetKwh: 10, hasSolar: false });
    expect(hours.every(h => h.production === 0)).toBe(true);
  });

  test('solar without battery → daylight bell, zero overnight', () => {
    const hours = simulateDailyUsage({ dailyTargetKwh: 10, hasSolar: true, hasHomeBattery: false });
    expect(hours[0].production).toBe(0);   // 00:00 — before sunrise
    expect(hours[3].production).toBe(0);   // 03:00 — overnight
    expect(hours[13].production).toBeGreaterThan(0); // 13:00 — midday peak
    // Total production is ~half of consumption.
    const prod = sum(hours as any, 'production');
    expect(prod).toBeGreaterThan(3.5);
    expect(prod).toBeLessThan(6.5);
  });

  test('solar with battery → production spread across the clock (incl. overnight)', () => {
    const hours = simulateDailyUsage({ dailyTargetKwh: 10, hasSolar: true, hasHomeBattery: true });
    expect(hours[2].production).toBeGreaterThan(0);  // 02:00 — battery discharges overnight
    const prod = sum(hours as any, 'production');
    expect(prod).toBeGreaterThan(3.5);
    expect(prod).toBeLessThan(6.5);
  });
});
