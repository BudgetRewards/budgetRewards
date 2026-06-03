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
  /** Highest possible production for an hour, in kWh. Default 1.5. */
  maxProduction?: number;
};

const HOURS_IN_DAY = 24;

/** Random kWh value within [min, max], rounded to 3 decimals. */
function randomKwh(min: number, max: number): number {
  return Number((min + Math.random() * (max - min)).toFixed(3));
}

/**
 * Simulate 24 hours of electricity usage. Every call generates fresh,
 * independent random consumption and production values for each hour.
 *
 * Pure function: returns the readings, does not touch the store.
 */
export function simulateDailyUsage(options: SimulateUsageOptions = {}): HourlyUsage[] {
  const {
    minConsumption = 0.1,
    maxConsumption = 2,
    minProduction = 0,
    maxProduction = 1.5,
  } = options;

  return Array.from({ length: HOURS_IN_DAY }, (_, hour) => ({
    hour,
    consumption: randomKwh(minConsumption, maxConsumption),
    production: randomKwh(minProduction, maxProduction),
  }));
}
