import { describe, test, expect } from 'vitest';
import { reducer } from '../reducer';
import { initialState } from '../initialState';
import type { RRState, RRAction } from '../types';

const freshState: RRState = {
  ...initialState,
  balance: 0,
  currentTier: 'seed',
  multiplier: 1,
  nextTier: { name: 'Boom', nameEn: 'Tree', threshold: 2500 },
  ledger: [],
  remoteReadEnabled: true,
};

function apply(state: RRState, payload: RRAction['payload']): RRState {
  return reducer(state, { type: 'APPLY_TRIGGER', payload });
}

describe('APPLY_TRIGGER', () => {
  test('appends ledger entry and updates balance', () => {
    const next = apply(freshState, { name: 'Test', cat: 'App & Data', base: 100, kind: 'pos' });
    expect(next.balance).toBe(100);
    expect(next.ledger[0].name).toBe('Test');
    expect(next.ledger[0].amount).toBe(100);
    expect(next.ledger[0].mult).toBe(1);
  });

  test('applies tier multiplier to amount', () => {
    const treeState = { ...freshState, currentTier: 'tree' as const, multiplier: 1.5 };
    const next = apply(treeState, { name: 'Test', cat: 'App & Data', base: 100, kind: 'pos' });
    expect(next.ledger[0].amount).toBe(150);
    expect(next.balance).toBe(150);
  });

  test('clamps balance to cap (10000)', () => {
    const nearCap = { ...freshState, balance: 9900 };
    const next = apply(nearCap, { name: 'Test', cat: 'App & Data', base: 500, kind: 'pos' });
    expect(next.balance).toBe(10000);
  });

  test('clamps balance to 0 — never negative', () => {
    const next = apply(freshState, { name: 'Penalty', cat: 'App & Data', base: -500, kind: 'neg' });
    expect(next.balance).toBe(0);
  });

  test('upgrades tier from seed to tree when balance crosses 2500', () => {
    const near = { ...freshState, balance: 2400 };
    const next = apply(near, { name: 'Test', cat: 'App & Data', base: 200, kind: 'pos' });
    expect(next.currentTier).toBe('tree');
    expect(next.multiplier).toBe(1.5);
    expect(next.nextTier).toEqual({ name: 'Bos', nameEn: 'Forest', threshold: 6000 });
  });

  test('upgrades tier from tree to forest when balance crosses 6000', () => {
    const near = { ...freshState, balance: 5900, currentTier: 'tree' as const, multiplier: 1.5 };
    const next = apply(near, { name: 'Test', cat: 'App & Data', base: 200, kind: 'pos' });
    expect(next.currentTier).toBe('forest');
    expect(next.multiplier).toBe(2);
    expect(next.nextTier).toBeNull();
  });

  test('tier never moves downward', () => {
    const forest = { ...freshState, balance: 6000, currentTier: 'forest' as const, multiplier: 2 };
    const next = apply(forest, { name: 'Penalty', cat: 'App & Data', base: -3000, kind: 'neg' });
    expect(next.currentTier).toBe('forest');
    expect(next.multiplier).toBe(2);
  });

  test('marks catalogue item as claimed when catalogueKey provided', () => {
    const next = apply(freshState, {
      name: 'App geactiveerd',
      cat: 'App & Data',
      base: 150,
      kind: 'pos',
      catalogueKey: 'App geactiveerd',
    });
    const item = next.catalogue
      .find(c => c.cat === 'App & Data')!
      .items.find(i => i.name === 'App geactiveerd');
    expect(item?.status).toBe('claimed');
  });

  test('marks harvest cell earned when harvestDate provided', () => {
    const next = apply(freshState, {
      name: 'Harvest Hours',
      cat: 'Harvest Hours',
      base: 10,
      kind: 'pos',
      harvestDate: '2026-08-02',
    });
    const aug = next.harvest.monthsData.find(mo => mo.m === 7)!;
    const cell = aug.cells.find(c => c && c.d === 2)!;
    expect(cell?.state).toBe('earned');
    expect(next.harvest.daysEarned).toBeGreaterThan(freshState.harvest.daysEarned);
  });

  test('sets remoteReadEnabled when setRemoteRead provided', () => {
    const next = apply(freshState, {
      name: 'Remote uitlezing uitgezet',
      cat: 'Energiegedrag',
      base: -60,
      kind: 'neg',
      setRemoteRead: false,
    });
    expect(next.remoteReadEnabled).toBe(false);
    const penaltyItem = next.catalogue
      .find(c => c.cat === 'Energiegedrag')!
      .items.find(i => i.name === 'Remote uitlezing uitgezet');
    expect(penaltyItem?.status).toBe('penalty');
  });
});
