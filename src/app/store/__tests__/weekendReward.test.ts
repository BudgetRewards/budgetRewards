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

/** Weekend seeds are only earned with electricity, so claim the 'Stroom' item. */
function withElectricity(state: RRState): RRState {
  return {
    ...state,
    catalogue: state.catalogue.map(cat =>
      cat.cat !== 'Multi-product' ? cat : {
        ...cat,
        items: cat.items.map(i => i.name === 'Stroom' ? { ...i, status: 'claimed' as const } : i),
      }
    ),
  };
}

// 2026-05-02 is a Saturday, 2026-05-03 the adjacent Sunday.
describe('weekend reward (SET_USAGE)', () => {
  test('awards once both weekend days earn green hours', () => {
    let s = withElectricity(initialState);
    const before = s.ledger.length;

    s = setUsage(s, '2026-05-02', 2, 1); // Saturday earned — Sunday still missing
    expect(s.ledger.length).toBe(before);
    expect(s.pendingReward).toBeNull();

    s = setUsage(s, '2026-05-03', 2, 1); // Sunday earned — weekend complete
    expect(s.ledger.length).toBe(before + 1);
    expect(s.ledger[0].cat).toBe('Harvest Hours');
    expect(s.ledger[0].name).toContain('Oogstweekend');
    expect(s.ledger[0].nameEn).toContain('Harvest weekend');
    // Awarded at the configured value, no tier multiplier (base === amount).
    expect(s.ledger[0].mult).toBe(1);
    expect(s.ledger[0].amount).toBe(s.ledger[0].base);
    expect(s.ledger[0].amount).toBe(20); // 'Oogstdag — verschuiving' seeds in config
    expect(s.historyUnseen).toBe(true);
    expect(s.pendingReward).not.toBeNull();
    expect(s.awardedWeekends).toContain('2026-05-02');
  });

  test('does not double-award the same weekend', () => {
    let s = withElectricity(initialState);
    s = setUsage(s, '2026-05-02', 2, 1);
    s = setUsage(s, '2026-05-03', 2, 1);
    const after = s.ledger.length;
    s = setUsage(s, '2026-05-02', 2, 1); // re-simulate Saturday
    expect(s.ledger.length).toBe(after);
  });

  test('without electricity, a completed weekend is recorded as a missed harvest', () => {
    let s = initialState; // no electricity by default
    s = setUsage(s, '2026-05-02', 2, 1);
    s = setUsage(s, '2026-05-03', 2, 1);
    expect(s.ledger[0].name).toContain('Oogstweekend');
    expect(s.ledger[0].kind).toBe('missed');
    expect(s.pendingReward).toBeNull(); // no celebratory toast for a missed harvest
    expect(s.balance).toBe(initialState.balance); // balance unchanged
  });

  test('no award when one day misses', () => {
    let s = initialState;
    s = setUsage(s, '2026-05-02', 2, 1); // earned
    s = setUsage(s, '2026-05-03', 1, 2); // missed (production > consumption)
    expect(s.pendingReward).toBeNull();
    expect(s.awardedWeekends).not.toContain('2026-05-02');
  });

  test('a weekend reward that crosses a threshold sets pendingTierUp', () => {
    // Weekend reward is 20 seeds; start at 2480 with electricity so the
    // completed weekend pushes the balance to 2500 (seed → tree).
    let s = withElectricity({ ...initialState, balance: 2480, currentTier: 'seed', multiplier: 1, pendingTierUp: null });
    s = setUsage(s, '2026-05-02', 2, 1); // Saturday earned
    expect(s.pendingTierUp).toBeNull();   // weekend not complete yet
    s = setUsage(s, '2026-05-03', 2, 1); // Sunday earned — weekend complete, +20 → 2500
    expect(s.currentTier).toBe('tree');
    expect(s.pendingTierUp).toEqual({ from: 'seed', to: 'tree' });
  });

  test('MARK_HISTORY_SEEN and DISMISS_REWARD clear their flags', () => {
    let s = withElectricity(initialState);
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
