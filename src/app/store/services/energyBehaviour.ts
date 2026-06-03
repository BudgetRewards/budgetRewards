import type { RRState, Dispatch } from '../types';
import { isAlreadyClaimed } from '../guards';

export function registerSolarPanels(state: RRState, dispatch: Dispatch): void {
  if (isAlreadyClaimed(state, 'Zonnepanelen geregistreerd')) return;
  dispatch({
    type: 'APPLY_TRIGGER',
    payload: {
      name: 'Zonnepanelen geregistreerd',
      nameEn: 'Solar panels registered',
      cat: 'Stroom bonussen',
      base: 30,
      kind: 'pos',
      catalogueKey: 'Zonnepanelen geregistreerd',
    },
  });
}
