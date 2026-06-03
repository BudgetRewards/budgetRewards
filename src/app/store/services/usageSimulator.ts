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
  /** Lowest possible consumption for an hour, in kWh. Default 0.1. */
  minConsumption?: number;
  /** Highest possible consumption for an hour, in kWh. Default 2. */
  maxConsumption?: number;
  /** Lowest possible production for an hour, in kWh. Default 0. */
  minProduction?: number;
  /**
   * Peak production for an hour, in kWh. Default 1.25 — tuned so the midday
   * solar production roughly matches typical consumption (0.1–2 per hour).
   * Either side can win at random, so without a battery a customer is about
   * equally likely to over- or under-consume during the day.
   */
  maxProduction?: number;
  /**
   * Whether the customer has a home battery. Default false.
   * - `true`:  production can occur at any hour (a battery can store solar
   *            and discharge/feed around the clock) — a flat random value
   *            per hour within [minProduction, maxProduction].
   * - `false`: production follows a solar curve — zero overnight, peaking
   *            around midday, capped at maxProduction.
   */
  hasHomeBattery?: boolean;
};

const HOURS_IN_DAY = 24;
const SUNRISE = 6; // first hour with any solar production
const SUNSET = 21; // first hour after which production returns to zero

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
  // Raised sine: 0 at sunrise/sunset, 1 at the midpoint of the daylight window.
  const daylightFraction = (hour - SUNRISE) / (SUNSET - SUNRISE);
  const shape = Math.sin(Math.PI * daylightFraction);
  const cloudJitter = 1 - Math.random() * 0.25; // vary down to ~75% of the peak
  return Number((maxProduction * shape * cloudJitter).toFixed(3));
}

/**
 * Simulate 24 hours of electricity usage. Every call generates fresh,
 * independent random values for each hour.
 *
 * Consumption is always random per hour. Production depends on
 * `hasHomeBattery` (see {@link SimulateUsageOptions}).
 *
 * Pure function: returns the readings, does not touch the store.
 */
export function simulateDailyUsage(options: SimulateUsageOptions = {}): HourlyUsage[] {
  const {
    minConsumption = 0.1,
    maxConsumption = 2,
    minProduction = 0,
    maxProduction = 1.25,
    hasHomeBattery = false,
  } = options;

  return Array.from({ length: HOURS_IN_DAY }, (_, hour) => ({
    hour,
    consumption: randomKwh(minConsumption, maxConsumption),
    production: hasHomeBattery
      ? randomKwh(minProduction, maxProduction)
      : solarProduction(hour, maxProduction),
  }));
}
