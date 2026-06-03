import { describe, test, expect, vi } from 'vitest';
import { registerSolarPanels } from '../../services/energyBehaviour';
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

describe('registerSolarPanels', () => {
  test('dispatches 600 seeds when not yet claimed', () => {
    const dispatch = vi.fn();
    registerSolarPanels(cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 600, catalogueKey: 'Zonnepanelen geregistreerd' }),
    });
  });

  test('does not dispatch when already claimed', () => {
    const dispatch = vi.fn();
    const claimed = {
      ...cleanState,
      catalogue: cleanState.catalogue.map(cat =>
        cat.cat === 'Multi-product'
          ? { ...cat, items: cat.items.map(i => i.name === 'Zonnepanelen geregistreerd' ? { ...i, status: 'claimed' as const } : i) }
          : cat
      ),
    };
    registerSolarPanels(claimed, dispatch);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
