import type { Dispatch } from '../types';
import { simulateDailyUsage, type SimulateUsageOptions } from './usageSimulator';

export type SimulateUsageParams = SimulateUsageOptions & {
  /** The day to simulate, as yyyy-mm-dd. Defaults to today. */
  date?: string;
};

/**
 * Run a fresh 24-hour usage simulation for a given day and push it into app
 * state so any screen/process can read it via `useRR().usage`.
 */
export function simulateUsage(params: SimulateUsageParams, dispatch: Dispatch): void {
  const { date, ...options } = params;
  dispatch({
    type: 'SET_USAGE',
    payload: {
      date: date ?? new Date().toISOString().slice(0, 10),
      generatedAt: new Date().toISOString(),
      hasHomeBattery: !!options.hasHomeBattery,
      hours: simulateDailyUsage(options),
    },
  });
}

/** Show an already-simulated day on the Usage screen (no regeneration). */
export function selectUsageDate(date: string, dispatch: Dispatch): void {
  dispatch({ type: 'SELECT_USAGE_DATE', payload: { date } });
}
