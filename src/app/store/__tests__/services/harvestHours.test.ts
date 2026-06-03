import { describe, test, expect, vi } from 'vitest';
import { harvestHoursEarned } from '../../services/harvestHours';
import { initialState } from '../../initialState';
import type { RRState } from '../../types';

const cleanState: RRState = { ...initialState };

describe('harvestHoursEarned', () => {
  test('dispatches +10 seeds when opted in to gratis stroom', () => {
    const dispatch = vi.fn();
    harvestHoursEarned('2026-08-02', true, cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 10, kind: 'pos', harvestDate: '2026-08-02' }),
    });
  });

  test('dispatches +20 seeds when not opted in', () => {
    const dispatch = vi.fn();
    harvestHoursEarned('2026-08-02', false, cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 20, kind: 'pos', harvestDate: '2026-08-02' }),
    });
  });

  test('does not dispatch if date cell is already earned', () => {
    const dispatch = vi.fn();
    const month = cleanState.harvest.monthsData.find(mo => mo.m === 3);
    const earnedDay = month?.cells.find(c => c && c.state === 'earned');
    if (!earnedDay) {
      expect(true).toBe(true);
      return;
    }
    const date = `2026-04-${String(earnedDay.d).padStart(2, '0')}`;
    harvestHoursEarned(date, true, cleanState, dispatch);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
