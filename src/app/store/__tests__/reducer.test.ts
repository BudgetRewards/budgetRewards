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
    // Welcome 1000 + App 150 + Stroom 500 + Internet 500 + Internet 50 Mbps (default 15)
    // + household bonus 50 = 2215
    expect(next.balance).toBe(2215);
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
    // Gas 400 + Welcome 1000 + App 150 + household 50 = 1600 (harvest missed → not counted)
    expect(next.balance).toBe(1600);
  });

  test('recomputes tier when the total crosses 2500', () => {
    const next = reducer(freshState, {
      type: 'APPLY_ONBOARDING',
      profile: { solarPanels: true, homeBattery: true, householdSize: 4, customerYears: 5, products: ['electricity', 'gas', 'internet', 'tv'] },
    });
    // Welcome 1000 + App 150 + Stroom 500 + Gas 400 + Internet 500 + TV 300
    // + Zonnepanelen (Stroom bonus, 30) + Internet 50 Mbps (default 15)
    // + 5 jaar trouw lid (1500, customerYears ≥ 5) = 4395
    // + battery 400 + household 4×50=200 + years 5×100=500 = 5495
    expect(next.balance).toBe(5495);
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

describe('pendingTierUp (tier-up celebration)', () => {
  test('sets pendingTierUp when an earning crosses seed → tree', () => {
    const near = { ...freshState, balance: 2400 };
    const next = apply(near, { name: 'Test', cat: 'App & Data', base: 200, kind: 'pos' });
    expect(next.currentTier).toBe('tree');
    expect(next.pendingTierUp).toEqual({ from: 'seed', to: 'tree' });
  });

  test('sets pendingTierUp when an earning crosses tree → forest', () => {
    const near = { ...freshState, balance: 5900, currentTier: 'tree' as const, multiplier: 1.5 };
    const next = apply(near, { name: 'Test', cat: 'App & Data', base: 200, kind: 'pos' });
    expect(next.currentTier).toBe('forest');
    expect(next.pendingTierUp).toEqual({ from: 'tree', to: 'forest' });
  });

  test('leaves pendingTierUp null when the earning does not change tier', () => {
    const next = apply(freshState, { name: 'Test', cat: 'App & Data', base: 100, kind: 'pos' });
    expect(next.currentTier).toBe('seed');
    expect(next.pendingTierUp).toBeNull();
  });

  test('does not celebrate onboarding placement into a higher tier', () => {
    const next = reducer(freshState, {
      type: 'APPLY_ONBOARDING',
      profile: { solarPanels: true, homeBattery: true, householdSize: 4, customerYears: 5, products: ['electricity', 'gas', 'internet', 'tv'] },
    });
    expect(next.currentTier).toBe('tree');
    expect(next.pendingTierUp).toBeNull();
  });

  test('DISMISS_TIER_UP clears pendingTierUp', () => {
    const near = { ...freshState, balance: 2400 };
    let s = apply(near, { name: 'Test', cat: 'App & Data', base: 200, kind: 'pos' });
    expect(s.pendingTierUp).not.toBeNull();
    s = reducer(s, { type: 'DISMISS_TIER_UP' });
    expect(s.pendingTierUp).toBeNull();
  });

  test('re-onboarding clears any pending tier-up celebration', () => {
    const withPending = { ...freshState, pendingTierUp: { from: 'seed' as const, to: 'tree' as const } };
    const next = reducer(withPending, {
      type: 'APPLY_ONBOARDING',
      profile: { solarPanels: false, homeBattery: false, householdSize: 1, customerYears: 0, products: ['electricity'] },
    });
    expect(next.pendingTierUp).toBeNull();
  });
});

describe('SELECT_EXCLUSIVE (mutually-exclusive groups)', () => {
  // Own the Mobile product so the 'Mobiel bonussen' sub-section is unlocked.
  const mobileOwned = reducer(freshState, {
    type: 'APPLY_ONBOARDING',
    profile: { solarPanels: false, homeBattery: false, householdSize: 1, customerYears: 0, products: ['mobile'] },
  });
  const bonus = (s: RRState, name: string) =>
    s.catalogue.find(c => c.cat === 'Mobiel bonussen')!.items.find(i => i.name === name);

  test('5 GB bundle is claimed by default; switching to 10 GB swaps and nets the balance', () => {
    expect(bonus(mobileOwned, 'Databundel 5 GB')?.status).toBe('claimed');
    const before = mobileOwned.balance;
    const next = reducer(mobileOwned, { type: 'SELECT_EXCLUSIVE', cat: 'Mobiel bonussen', catalogueKey: 'Databundel 10 GB' });
    expect(bonus(next, 'Databundel 10 GB')?.status).toBe('claimed');
    expect(bonus(next, 'Databundel 5 GB')?.status).toBe('available');
    expect(next.balance).toBe(before - 15 + 25); // swap 5 GB → 10 GB
  });

  test('switching bundles swaps the claim and nets the balance (no stacking)', () => {
    let s = reducer(mobileOwned, { type: 'SELECT_EXCLUSIVE', cat: 'Mobiel bonussen', catalogueKey: 'Databundel 10 GB' });
    const after10 = s.balance;
    s = reducer(s, { type: 'SELECT_EXCLUSIVE', cat: 'Mobiel bonussen', catalogueKey: 'Onbeperkte databundel' });
    expect(bonus(s, 'Databundel 10 GB')?.status).toBe('available');
    expect(bonus(s, 'Onbeperkte databundel')?.status).toBe('claimed');
    expect(s.balance).toBe(after10 - 25 + 100);
    // Exactly one bundle option is claimed.
    const claimed = s.catalogue.find(c => c.cat === 'Mobiel bonussen')!
      .items.filter(i => i.group === 'mobile-bundle' && i.status === 'claimed');
    expect(claimed).toHaveLength(1);
  });

  test('mobile speed: 100 Mbps claimed by default, upgrading swaps to 200', () => {
    expect(bonus(mobileOwned, 'Mobiel 100 Mbps (standaard)')?.status).toBe('claimed');
    const s = reducer(mobileOwned, { type: 'SELECT_EXCLUSIVE', cat: 'Mobiel bonussen', catalogueKey: 'Upgrade naar 200 Mbps' });
    expect(bonus(s, 'Mobiel 100 Mbps (standaard)')?.status).toBe('available');
    expect(bonus(s, 'Upgrade naar 200 Mbps')?.status).toBe('claimed');
    expect(s.balance).toBe(mobileOwned.balance - 10 + 25);
  });

  test('re-selecting the already-claimed option is a no-op', () => {
    const s = reducer(mobileOwned, { type: 'SELECT_EXCLUSIVE', cat: 'Mobiel bonussen', catalogueKey: 'Mobiel 100 Mbps (standaard)' });
    expect(s).toBe(mobileOwned);
  });
});

describe('product activation auto-claims group defaults', () => {
  test('activating Internet claims the default 50 Mbps speed and awards its seeds', () => {
    // freshState: Internet is not owned, its bonus section is locked.
    const before = freshState.balance;
    const next = apply(freshState, {
      name: 'Internet', cat: 'Multi-product', base: 500, kind: 'pos', catalogueKey: 'Internet',
    });
    const speed = next.catalogue.find(c => c.cat === 'Internet bonussen')!
      .items.find(i => i.name === 'Internet 50 Mbps');
    expect(speed?.status).toBe('claimed');
    // Internet 500 (tier 1×) + default 50 Mbps 15.
    expect(next.balance).toBe(before + 500 + 15);
    // The default also lands in the ledger.
    expect(next.ledger.some(e => e.name === 'Internet 50 Mbps')).toBe(true);
  });
});
