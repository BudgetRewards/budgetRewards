import type { RRState, Dispatch } from '../types';

function isAlreadyEarned(state: RRState, isoDate: string): boolean {
  const [, month, day] = isoDate.split('-').map(Number);
  const m = month - 1;
  const d = day;
  const monthData = state.harvest.monthsData.find(mo => mo.m === m);
  if (!monthData) return false;
  const cell = monthData.cells.find(c => c && c.d === d);
  return cell?.state === 'earned';
}

export function harvestHoursEarned(
  isoDate: string,
  optedIn: boolean,
  state: RRState,
  dispatch: Dispatch,
): void {
  if (isAlreadyEarned(state, isoDate)) return;
  const base = optedIn ? 10 : 20;
  const label = optedIn ? 'Oogstdag — gratis stroom' : 'Oogstdag — verschuiving';
  dispatch({
    type: 'APPLY_TRIGGER',
    payload: { name: label, cat: 'Harvest Hours', base, kind: 'pos', harvestDate: isoDate },
  });
}
