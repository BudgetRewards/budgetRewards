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
  /**
   * Whether the customer has solar panels. Default false. Without solar there
   * is no production at all (every hour's production is 0).
   */
  hasSolar?: boolean;
  /**
   * Whether the customer has a home battery. Default false. Only relevant when
   * `hasSolar` is true:
   * - `true`:  stored solar discharges around the clock — production is spread
   *            flatly across all 24 hours.
   * - `false`: production follows a solar bell curve — zero overnight, peaking
   *            around midday.
   */
  hasHomeBattery?: boolean;
};

/** Solar production as a fraction of daily consumption (so net stays realistic). */
const SOLAR_OFFSET = 0.5;

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

/**
 * Relative production weight per hour. With a battery, production is spread
 * flatly across the day; otherwise it follows a daylight solar bell (zero
 * overnight, peaking around solar noon).
 */
function productionWeight(hour: number, hasHomeBattery: boolean): number {
  if (hasHomeBattery) return 1; // flat across all 24 hours
  if (hour < SUNRISE || hour >= SUNSET) return 0;
  const daylightFraction = (hour - SUNRISE) / (SUNSET - SUNRISE);
  return Math.sin(Math.PI * daylightFraction);
}

/**
 * Simulate 24 hours of electricity usage.
 *
 * Consumption follows a realistic shaped daily profile (low overnight, morning
 * and evening peaks) scaled to `dailyTargetKwh`, with ±15 % random jitter per
 * hour.
 *
 * Production is zero unless `hasSolar` is true. With solar, the day's total
 * production is ~50 % of consumption, distributed either flatly (battery) or as
 * a daylight solar bell (no battery), with per-hour jitter.
 *
 * Pure function: returns the readings, does not touch the store.
 */
export function simulateDailyUsage(options: SimulateUsageOptions = {}): HourlyUsage[] {
  const {
    dailyTargetKwh = 7.1,
    hasSolar       = false,
    hasHomeBattery = false,
  } = options;

  // Production target for the day and its hourly distribution weights.
  const prodTarget = hasSolar ? dailyTargetKwh * SOLAR_OFFSET : 0;
  const prodWeights = Array.from({ length: HOURS_IN_DAY }, (_, h) => productionWeight(h, hasHomeBattery));
  const prodWeightSum = prodWeights.reduce((a, b) => a + b, 0) || 1;

  return Array.from({ length: HOURS_IN_DAY }, (_, hour) => {
    const consJitter = 0.85 + Math.random() * 0.30; // ±15 % per hour
    const consumption = (HOURLY_WEIGHTS[hour] / WEIGHT_SUM) * dailyTargetKwh * consJitter;

    const prodBase = prodTarget * (prodWeights[hour] / prodWeightSum);
    const production = prodBase > 0 ? prodBase * (0.85 + Math.random() * 0.30) : 0;

    return {
      hour,
      consumption: Number(consumption.toFixed(3)),
      production: Number(production.toFixed(3)),
    };
  });
}
