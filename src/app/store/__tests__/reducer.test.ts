import { describe, test, expect } from 'vitest';
import { reducer } from '../reducer';
import { initialState } from '../initialState';
import type { RRState, TriggerPayload } from '../types';

const freshState: RRState = {
  ...initialState,
  balance: 0,
  currentTier: 'seed',
  multiplier: 1,
  nextTier: { name: 'Boom', nameEn: 'Tree', threshold: 2500 },
  ledger: [],
  remoteReadEnabled: true,
};

function apply(state: RRState, payload: TriggerPayload): RRState {
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

  test('a missed harvest does not change the balance', () => {
    const withBalance = { ...freshState, balance: 200 };
    const next = apply(withBalance, { name: 'Gemiste oogst', cat: 'Energiegedrag', base: 60, kind: 'missed' });
    expect(next.balance).toBe(200);
    expect(next.ledger[0].kind).toBe('missed');
    expect(next.ledger[0].amount).toBe(60);
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

  test('a missed harvest never lowers the tier or balance', () => {
    const forest = { ...freshState, balance: 6000, currentTier: 'forest' as const, multiplier: 2 };
    const next = apply(forest, { name: 'Gemiste oogst', cat: 'Energiegedrag', base: 3000, kind: 'missed' });
    expect(next.balance).toBe(6000);
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

  test('sets remoteReadEnabled and marks the item missed when setRemoteRead is false', () => {
    const next = apply(freshState, {
      name: 'Remote uitlezing uitgezet',
      cat: 'Energiegedrag',
      base: 60,
      kind: 'missed',
      setRemoteRead: false,
    });
    expect(next.remoteReadEnabled).toBe(false);
    const missedItem = next.catalogue
      .find(c => c.cat === 'Energiegedrag')!
      .items.find(i => i.name === 'Remote uitlezing aangezet');
    expect(missedItem?.status).toBe('missed');
  });
});

function multiItem(state: RRState, name: string) {
  return state.catalogue.find(c => c.cat === 'Multi-product')!.items.find(i => i.name === name);
}
function harvestItem(state: RRState, name: string) {
  return state.catalogue.find(c => c.cat === 'Harvest Hours')!.items.find(i => i.name === name);
}

describe('APPLY_ONBOARDING', () => {
  test('claims selected products + Welcome; counts only those in the balance', () => {
    const next = reducer(freshState, {
      type: 'APPLY_ONBOARDING',
      profile: { solarPanels: false, homeBattery: false, householdSize: 1, customerYears: 0, products: ['electricity', 'internet'] },
    });
    // Welcome 1000 + Stroom 500 + Internet 500 + household bonus 50 = 2050
    expect(next.balance).toBe(2050);
    expect(next.currentTier).toBe('seed');
    expect(multiItem(next, 'Stroom')?.status).toBe('claimed');
    expect(multiItem(next, 'Internet')?.status).toBe('claimed');
    expect(multiItem(next, 'Gas')?.status).toBe('missed');
  });

  test('with electricity, harvest opportunities stay available (earnable)', () => {
    const next = reducer(freshState, {
      type: 'APPLY_ONBOARDING',
      profile: { solarPanels: false, homeBattery: false, householdSize: 1, customerYears: 0, products: ['electricity'] },
    });
    expect(harvestItem(next, 'Oogstdag — gratis stroom')?.status).toBe('available');
  });

  test('without electricity, harvest opportunities become missed', () => {
    const next = reducer(freshState, {
      type: 'APPLY_ONBOARDING',
      profile: { solarPanels: false, homeBattery: false, householdSize: 1, customerYears: 0, products: ['gas'] },
    });
    expect(harvestItem(next, 'Oogstdag — gratis stroom')?.status).toBe('missed');
    // Gas 400 + Welcome 1000 + household 50 = 1450 (harvest missed → not counted)
    expect(next.balance).toBe(1450);
  });

  test('recomputes tier when the total crosses 2500', () => {
    const next = reducer(freshState, {
      type: 'APPLY_ONBOARDING',
      profile: { solarPanels: true, homeBattery: true, householdSize: 4, customerYears: 5, products: ['electricity', 'gas', 'internet', 'tv'] },
    });
    // Welcome 1000 + Stroom 500 + Gas 400 + Internet 500 + TV 300
    // + Zonnepanelen (Stroom bonus sub-item, 30) = 2730
    // + battery 400 + household 4×50=200 + years 5×100=500 = 3830
    expect(next.balance).toBe(3830);
    expect(next.currentTier).toBe('tree');
    expect(next.multiplier).toBe(1.5);
  });

  test('clamps the total to the cap', () => {
    const lowCap = { ...freshState, cap: 1000 };
    const next = reducer(lowCap, {
      type: 'APPLY_ONBOARDING',
      profile: { solarPanels: true, homeBattery: true, householdSize: 6, customerYears: 20, products: ['electricity', 'gas', 'internet', 'tv', 'mobile', 'landline'] },
    });
    expect(next.balance).toBe(1000);
  });
});
