import { describe, test, expect, vi } from 'vitest';
import { addProduct } from '../../services/multiProduct';
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

describe('addProduct', () => {
  test('dispatches 500 seeds for second product (Internet)', () => {
    const dispatch = vi.fn();
    addProduct('Internet', cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 500, catalogueKey: 'Tweede product: Internet' }),
    });
  });

  test('dispatches 750 seeds for third product (Verzekering)', () => {
    const dispatch = vi.fn();
    addProduct('Verzekering', cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 750, catalogueKey: 'Derde product: Verzekering' }),
    });
  });

  test('does not dispatch if product already claimed', () => {
    const dispatch = vi.fn();
    const claimed = {
      ...cleanState,
      catalogue: cleanState.catalogue.map(cat =>
        cat.cat === 'Multi-product'
          ? { ...cat, items: cat.items.map(i => i.name === 'Tweede product: Internet' ? { ...i, status: 'claimed' as const } : i) }
          : cat
      ),
    };
    addProduct('Internet', claimed, dispatch);
    expect(dispatch).not.toHaveBeenCalled();
  });

  test('does not dispatch for unknown product', () => {
    const dispatch = vi.fn();
    addProduct('Unknown', cleanState, dispatch);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
