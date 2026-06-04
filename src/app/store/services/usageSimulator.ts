/**
 * A single hourly electricity reading.
 * `hour` is 0–23 (local time); `consumption` and `production` are both in kWh.
 */
export type HourlyUsage = {
  hour: number;
  consumption: number;
  production: number;
};

export type SimulateUsageOptions = {
  /**
   * Target total daily consumption in kWh. The simulator shapes the 24 hours
   * proportionally to match this value (with ±15 % random jitter per hour).
   * Defaults to 7.1 kWh — the CBS Dutch average for a 2-person household
   * (213 kWh/month ÷ 30 days).
   */
  dailyTargetKwh?: number;
  /** Lowest possible production for an hour, in kWh. Default 0. */
  minProduction?: number;
  /**
   * Peak solar production per hour, in kWh. Default 1.25 — tuned so the
   * midday solar bell can exceed or fall below a single hour's consumption,
   * keeping the harvest-hours dynamic interesting.
   */
  maxProduction?: number;
  /**
   * Whether the customer has a home battery. Default false.
   * - `true`:  production can occur at any hour (stored solar discharges
   *            around the clock) — a flat random value per hour.
   * - `false`: production follows a solar bell curve — zero overnight,
   *            peaking around midday.
   */
  hasHomeBattery?: boolean;
};

const HOURS_IN_DAY = 24;
const SUNRISE = 6;
const SUNSET  = 21;

/**
 * Relative consumption weight per hour of the day.
 * The 24 weights sum to WEIGHT_SUM; each weight divided by WEIGHT_SUM gives
 * the fraction of the daily target consumed in that hour.
 *
 * Shape: low overnight → morning peak → quiet daytime → dinner/evening peak.
 */
const HOURLY_WEIGHTS = [
  // 00-05  sleep / standby / fridge
  0.30, 0.25, 0.20, 0.20, 0.25, 0.30,
  // 06-08  morning routine (shower, kettle, toast)
  0.70, 0.90, 0.75,
  // 09-11  daytime (home office or mostly standby)
  0.50, 0.45, 0.40,
  // 12-13  lunch
  0.55, 0.50,
  // 14-16  quiet afternoon
  0.40, 0.35, 0.40,
  // 17-19  dinner cooking + arriving home
  0.85, 1.00, 0.90,
  // 20-22  TV, lights, laundry
  0.80, 0.75, 0.65,
  // 23     winding down
  0.40,
];
const WEIGHT_SUM = HOURLY_WEIGHTS.reduce((a, b) => a + b, 0); // ≈ 12.75

/** Random kWh value within [min, max], rounded to 3 decimals. */
function randomKwh(min: number, max: number): number {
  return Number((min + Math.random() * (max - min)).toFixed(3));
}

/**
 * Solar production for a given hour: zero outside daylight, bell-shaped and
 * peaking around solar noon. Intensity is jittered (clouds) but the shape and
 * the overnight zeros are preserved.
 */
function solarProduction(hour: number, maxProduction: number): number {
  if (hour < SUNRISE || hour >= SUNSET) return 0;
  const daylightFraction = (hour - SUNRISE) / (SUNSET - SUNRISE);
  const shape = Math.sin(Math.PI * daylightFraction);
  const cloudJitter = 1 - Math.random() * 0.25;
  return Number((maxProduction * shape * cloudJitter).toFixed(3));
}

/**
 * Simulate 24 hours of electricity usage.
 *
 * Consumption follows a realistic shaped daily profile (low overnight,
 * morning and evening peaks) scaled to `dailyTargetKwh`, with ±15 % random
 * jitter per hour. The daily total therefore varies roughly ±5 % around the
 * target — close enough to represent natural day-to-day variation.
 *
 * Production depends on `hasHomeBattery` (see {@link SimulateUsageOptions}).
 *
 * Pure function: returns the readings, does not touch the store.
 */
export function simulateDailyUsage(options: SimulateUsageOptions = {}): HourlyUsage[] {
  const {
    dailyTargetKwh = 7.1,
    minProduction  = 0,
    maxProduction  = 1.25,
    hasHomeBattery = false,
  } = options;

  return Array.from({ length: HOURS_IN_DAY }, (_, hour) => {
    const base    = (HOURLY_WEIGHTS[hour] / WEIGHT_SUM) * dailyTargetKwh;
    const jitter  = 0.85 + Math.random() * 0.30; // ±15 % per hour
    return {
      hour,
      consumption: Number((base * jitter).toFixed(3)),
      production: hasHomeBattery
        ? randomKwh(minProduction, maxProduction)
        : solarProduction(hour, maxProduction),
    };
  });
}
