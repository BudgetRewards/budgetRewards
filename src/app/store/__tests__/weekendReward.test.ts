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

/** Claim the 'Stroom' catalogue item so hasElectricity() returns true. */
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
describe('harvest day reward (SET_USAGE)', () => {
  test('awards 10 seeds immediately for a Saturday when electricity is owned', () => {
    let s = withElectricity(initialState);
    const before = s.ledger.length;
    s = setUsage(s, '2026-05-02', 2, 1);
    expect(s.ledger.length).toBe(before + 1);
    expect(s.ledger[0].cat).toBe('Harvest Hours');
    expect(s.ledger[0].kind).toBe('pos');
    expect(s.ledger[0].amount).toBe(10);
    expect(s.historyUnseen).toBe(true);
    expect(s.pendingReward).not.toBeNull();
    expect(s.awardedHarvestDays).toContain('2026-05-02');
  });

  test('awards 10 seeds immediately for a Sunday when electricity is owned', () => {
    let s = withElectricity(initialState);
    const before = s.ledger.length;
    s = setUsage(s, '2026-05-03', 2, 1);
    expect(s.ledger.length).toBe(before + 1);
    expect(s.ledger[0].cat).toBe('Harvest Hours');
    expect(s.ledger[0].kind).toBe('pos');
    expect(s.ledger[0].amount).toBe(10);
    expect(s.awardedHarvestDays).toContain('2026-05-03');
  });

  test('Saturday and Sunday each award independently', () => {
    let s = withElectricity(initialState);
    const before = s.ledger.length;
    s = setUsage(s, '2026-05-02', 2, 1); // Saturday
    s = setUsage(s, '2026-05-03', 2, 1); // Sunday
    expect(s.ledger.length).toBe(before + 2);
    expect(s.balance).toBe(initialState.balance + 20); // 10 + 10
  });

  test('does not double-award the same day', () => {
    let s = withElectricity(initialState);
    s = setUsage(s, '2026-05-02', 2, 1);
    const after = s.ledger.length;
    s = setUsage(s, '2026-05-02', 2, 1); // same day again
    expect(s.ledger.length).toBe(after);
  });

  test('without electricity, weekend day is recorded as missed harvest (no balance change)', () => {
    let s = initialState; // no electricity
    const balanceBefore = s.balance;
    const before = s.ledger.length;
    s = setUsage(s, '2026-05-02', 2, 1);
    expect(s.ledger.length).toBe(before + 1);
    expect(s.ledger[0].kind).toBe('missed');
    expect(s.balance).toBe(balanceBefore); // no balance change for missed
    expect(s.pendingReward).toBeNull(); // no toast for missed harvest
    expect(s.awardedHarvestDays).toContain('2026-05-02');
  });

  test('weekday simulation does not produce a harvest entry', () => {
    let s = withElectricity(initialState);
    const before = s.ledger.length;
    s = setUsage(s, '2026-05-04', 2, 1); // Monday
    expect(s.ledger.length).toBe(before);
    expect(s.awardedHarvestDays).not.toContain('2026-05-04');
  });

  test('a harvest day that crosses a threshold sets pendingTierUp', () => {
    // Harvest days award 10 seeds each; start at 2480 with electricity so the
    // second day pushes the balance to 2500 (seed → tree).
    let s = withElectricity({ ...initialState, balance: 2480, currentTier: 'seed', multiplier: 1, pendingTierUp: null });
    s = setUsage(s, '2026-05-02', 2, 1); // Saturday earned → 2490, still seed
    expect(s.pendingTierUp).toBeNull();
    s = setUsage(s, '2026-05-03', 2, 1); // Sunday earned → 2500, crosses to tree
    expect(s.currentTier).toBe('tree');
    expect(s.pendingTierUp).toEqual({ from: 'seed', to: 'tree' });
  });

  test('MARK_HISTORY_SEEN and DISMISS_REWARD clear their flags', () => {
    let s = withElectricity(initialState);
    s = setUsage(s, '2026-05-02', 2, 1);
    expect(s.historyUnseen).toBe(true);
    expect(s.pendingReward).not.toBeNull();

    s = reducer(s, { type: 'MARK_HISTORY_SEEN' });
    expect(s.historyUnseen).toBe(false);

    s = reducer(s, { type: 'DISMISS_REWARD' });
    expect(s.pendingReward).toBeNull();
  });
});
