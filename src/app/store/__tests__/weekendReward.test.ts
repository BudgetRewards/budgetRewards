import { describe, test, expect } from 'vitest';
import { reducer } from '../reducer';
import { initialState } from '../initialState';
import type { RRState } from '../types';

function setUsage(state: RRState, date: string, consumption: number, production: number): RRState {
  return reducer(state, {
    type: 'SET_USAGE',
    payload: {
      date,
      generatedAt: '',
      hasHomeBattery: false,
      hours: Array.from({ length: 24 }, (_, hour) => ({ hour, consumption, production })),
    },
  });
}

// 2026-05-02 is a Saturday, 2026-05-03 the adjacent Sunday.
describe('weekend reward (SET_USAGE)', () => {
  test('awards once both weekend days earn green hours', () => {
    let s = initialState;
    const before = s.ledger.length;

    s = setUsage(s, '2026-05-02', 2, 1); // Saturday earned — Sunday still missing
    expect(s.ledger.length).toBe(before);
    expect(s.pendingReward).toBeNull();

    s = setUsage(s, '2026-05-03', 2, 1); // Sunday earned — weekend complete
    expect(s.ledger.length).toBe(before + 1);
    expect(s.ledger[0].cat).toBe('Harvest Hours');
    expect(s.ledger[0].name).toContain('Oogstweekend');
    expect(s.ledger[0].nameEn).toContain('Harvest weekend');
    expect(s.historyUnseen).toBe(true);
    expect(s.pendingReward).not.toBeNull();
    expect(s.awardedWeekends).toContain('2026-05-02');
  });

  test('does not double-award the same weekend', () => {
    let s = initialState;
    s = setUsage(s, '2026-05-02', 2, 1);
    s = setUsage(s, '2026-05-03', 2, 1);
    const after = s.ledger.length;
    s = setUsage(s, '2026-05-02', 2, 1); // re-simulate Saturday
    expect(s.ledger.length).toBe(after);
  });

  test('no award when one day misses', () => {
    let s = initialState;
    s = setUsage(s, '2026-05-02', 2, 1); // earned
    s = setUsage(s, '2026-05-03', 1, 2); // missed (production > consumption)
    expect(s.pendingReward).toBeNull();
    expect(s.awardedWeekends).not.toContain('2026-05-02');
  });

  test('MARK_HISTORY_SEEN and DISMISS_REWARD clear their flags', () => {
    let s = initialState;
    s = setUsage(s, '2026-05-02', 2, 1);
    s = setUsage(s, '2026-05-03', 2, 1);
    expect(s.historyUnseen).toBe(true);
    expect(s.pendingReward).not.toBeNull();

    s = reducer(s, { type: 'MARK_HISTORY_SEEN' });
    expect(s.historyUnseen).toBe(false);

    s = reducer(s, { type: 'DISMISS_REWARD' });
    expect(s.pendingReward).toBeNull();
  });
});
