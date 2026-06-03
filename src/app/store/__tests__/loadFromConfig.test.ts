import { describe, test, expect, beforeEach } from 'vitest';
import { loadFromConfig, baseInitialState } from '../initialState';
import type { RRState } from '../types';

const minimalState: RRState = {
  ...baseInitialState,
  balance: 0,
  currentTier: 'seed',
  multiplier: 1,
  nextTier: { name: 'Boom', nameEn: 'Tree', threshold: 2500 },
  catalogue: [
    { cat: 'Test', items: [
      { name: 'Item A', seeds: 1000, status: 'available' },
      { name: 'Item B', seeds: 200,  status: 'available' },
      { name: 'Item C', seeds: -60,  status: 'available' },
    ]},
  ],
};

beforeEach(() => localStorage.clear());

describe('loadFromConfig', () => {
  test('returns base state unchanged when localStorage is empty', () => {
    const result = loadFromConfig(minimalState);
    expect(result).toEqual(minimalState);
  });

  test('applies catalogue status overrides', () => {
    localStorage.setItem('rr-config', JSON.stringify({
      catalogue: [{ name: 'Item A', status: 'claimed' }],
    }));
    const result = loadFromConfig(minimalState);
    const item = result.catalogue[0].items.find(i => i.name === 'Item A');
    expect(item?.status).toBe('claimed');
  });

  test('does not affect items not in the override list', () => {
    localStorage.setItem('rr-config', JSON.stringify({
      catalogue: [{ name: 'Item A', status: 'claimed' }],
    }));
    const result = loadFromConfig(minimalState);
    const itemB = result.catalogue[0].items.find(i => i.name === 'Item B');
    expect(itemB?.status).toBe('available');
  });

  test('recomputes balance from claimed items', () => {
    localStorage.setItem('rr-config', JSON.stringify({
      catalogue: [
        { name: 'Item A', status: 'claimed' },
        { name: 'Item B', status: 'claimed' },
      ],
    }));
    const result = loadFromConfig(minimalState);
    expect(result.balance).toBe(1200);
  });

  test('includes penalty items as negative in balance', () => {
    localStorage.setItem('rr-config', JSON.stringify({
      catalogue: [
        { name: 'Item A', status: 'claimed' },
        { name: 'Item C', status: 'penalty' },
      ],
    }));
    const result = loadFromConfig(minimalState);
    expect(result.balance).toBe(940);
  });

  test('clamps balance to 0 — never negative', () => {
    localStorage.setItem('rr-config', JSON.stringify({
      catalogue: [{ name: 'Item C', status: 'penalty' }],
    }));
    const result = loadFromConfig(minimalState);
    expect(result.balance).toBe(0);
  });

  test('sets tree tier when balance >= 2500', () => {
    const bigState: RRState = {
      ...minimalState,
      catalogue: [{ cat: 'Test', items: [{ name: 'Big', seeds: 2500, status: 'available' }] }],
    };
    localStorage.setItem('rr-config', JSON.stringify({
      catalogue: [{ name: 'Big', status: 'claimed' }],
    }));
    const result = loadFromConfig(bigState);
    expect(result.currentTier).toBe('tree');
    expect(result.multiplier).toBe(1.5);
    expect(result.nextTier).toEqual({ name: 'Bos', nameEn: 'Forest', threshold: 6000 });
  });

  test('sets forest tier when balance >= 6000 and nextTier is null', () => {
    const bigState: RRState = {
      ...minimalState,
      catalogue: [{ cat: 'Test', items: [{ name: 'Huge', seeds: 6000, status: 'available' }] }],
    };
    localStorage.setItem('rr-config', JSON.stringify({
      catalogue: [{ name: 'Huge', status: 'claimed' }],
    }));
    const result = loadFromConfig(bigState);
    expect(result.currentTier).toBe('forest');
    expect(result.multiplier).toBe(2);
    expect(result.nextTier).toBeNull();
  });

  test('ignores unknown item names in overrides', () => {
    localStorage.setItem('rr-config', JSON.stringify({
      catalogue: [{ name: 'Does Not Exist', status: 'claimed' }],
    }));
    const result = loadFromConfig(minimalState);
    expect(result.balance).toBe(0);
  });

  test('returns base state unchanged on malformed localStorage JSON', () => {
    localStorage.setItem('rr-config', 'not-valid-json');
    const result = loadFromConfig(minimalState);
    expect(result).toEqual(minimalState);
  });
});

describe('loadFromConfig — onboarding profile', () => {
  test('folds onboarding seeds from rr-profile into balance and ledger', () => {
    localStorage.setItem('rr-profile', JSON.stringify({
      solarPanels: true, homeBattery: false, householdSize: 2, customerYears: 0, products: ['electricity'],
    }));
    const result = loadFromConfig(minimalState);
    // 600 (solar) + 250×1 (product) + 50×2 (household) = 950
    expect(result.balance).toBe(950);
    expect(result.ledger.length).toBe(3);
  });

  test('no rr-profile leaves base ledger and balance untouched', () => {
    const result = loadFromConfig(minimalState);
    expect(result.balance).toBe(0);
    expect(result.ledger).toEqual(minimalState.ledger);
  });

  test('malformed rr-profile is ignored', () => {
    localStorage.setItem('rr-profile', 'not-json');
    const result = loadFromConfig(minimalState);
    expect(result.balance).toBe(0);
  });
});
