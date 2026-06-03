import { describe, test, expect, vi } from 'vitest';
import { optInGratisStroom, optInRenewalComms, optInAnalytics, toggleRemoteRead } from '../../services/appData';
import { initialState } from '../../initialState';
import type { RRState } from '../../types';

const cleanState: RRState = {
  ...initialState,
  balance: 0,
  ledger: [],
  remoteReadEnabled: true,
  catalogue: initialState.catalogue.map(cat => ({
    ...cat,
    items: cat.items.map(item => ({ ...item, status: 'available' as const })),
  })),
};

describe('optInGratisStroom', () => {
  test('dispatches 150 seeds', () => {
    const dispatch = vi.fn();
    optInGratisStroom(cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 150, catalogueKey: 'Oogstdag — gratis stroom' }),
    });
  });

  test('does not dispatch when already claimed', () => {
    const dispatch = vi.fn();
    const claimed = {
      ...cleanState,
      catalogue: cleanState.catalogue.map(cat =>
        cat.cat === 'Harvest Hours'
          ? { ...cat, items: cat.items.map(i => i.name === 'Oogstdag — gratis stroom' ? { ...i, status: 'claimed' as const } : i) }
          : cat
      ),
    };
    optInGratisStroom(claimed, dispatch);
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('optInRenewalComms', () => {
  test('dispatches 200 seeds', () => {
    const dispatch = vi.fn();
    optInRenewalComms(cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 200, catalogueKey: 'Pushmeldingen aangezet' }),
    });
  });
});

describe('optInAnalytics', () => {
  test('dispatches 50 seeds', () => {
    const dispatch = vi.fn();
    optInAnalytics(cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 50 }),
    });
  });
});

describe('toggleRemoteRead', () => {
  test('applies -60 penalty when disabling', () => {
    const dispatch = vi.fn();
    toggleRemoteRead(false, cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: -60, kind: 'neg', setRemoteRead: false }),
    });
  });

  test('applies +60 restoration when enabling', () => {
    const dispatch = vi.fn();
    const disabled = { ...cleanState, remoteReadEnabled: false };
    toggleRemoteRead(true, disabled, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 60, kind: 'pos', setRemoteRead: true }),
    });
  });

  test('does not dispatch when already in requested state', () => {
    const dispatch = vi.fn();
    toggleRemoteRead(true, cleanState, dispatch);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
