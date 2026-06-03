import { describe, test, expect, vi } from 'vitest';
import { signupBonus, appActivated, renewContract } from '../../services/lifecycle';
import { initialState } from '../../initialState';
import type { RRState } from '../../types';

const cleanState: RRState = {
  ...initialState,
  balance: 0,
  ledger: [],
  catalogue: initialState.catalogue.map(cat => ({
    ...cat,
    items: cat.items.map(item => ({ ...item, status: 'available' as const })),
  })),
};

describe('signupBonus', () => {
  test('dispatches 1000 seeds when not yet claimed', () => {
    const dispatch = vi.fn();
    signupBonus(cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 1000, catalogueKey: 'Welkomstbonus' }),
    });
  });

  test('does not dispatch when already claimed', () => {
    const dispatch = vi.fn();
    const claimed = {
      ...cleanState,
      catalogue: cleanState.catalogue.map(cat =>
        cat.cat === 'Contract & Lifecycle'
          ? { ...cat, items: cat.items.map(i => i.name === 'Welkomstbonus' ? { ...i, status: 'claimed' as const } : i) }
          : cat
      ),
    };
    signupBonus(claimed, dispatch);
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('appActivated', () => {
  test('dispatches 150 seeds when not yet claimed', () => {
    const dispatch = vi.fn();
    appActivated(cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 150, catalogueKey: 'App geactiveerd' }),
    });
  });

  test('does not dispatch when already claimed', () => {
    const dispatch = vi.fn();
    const claimed = {
      ...cleanState,
      catalogue: cleanState.catalogue.map(cat =>
        cat.cat === 'App & Data'
          ? { ...cat, items: cat.items.map(i => i.name === 'App geactiveerd' ? { ...i, status: 'claimed' as const } : i) }
          : cat
      ),
    };
    appActivated(claimed, dispatch);
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('renewContract', () => {
  test('dispatches 400 seeds when not yet claimed', () => {
    const dispatch = vi.fn();
    renewContract(cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 400, catalogueKey: 'Contract verlengd (1 jaar)' }),
    });
  });

  test('does not dispatch when already claimed', () => {
    const dispatch = vi.fn();
    const claimed = {
      ...cleanState,
      catalogue: cleanState.catalogue.map(cat =>
        cat.cat === 'Contract & Lifecycle'
          ? { ...cat, items: cat.items.map(i => i.name === 'Contract verlengd (1 jaar)' ? { ...i, status: 'claimed' as const } : i) }
          : cat
      ),
    };
    renewContract(claimed, dispatch);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
