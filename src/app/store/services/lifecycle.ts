import type { RRState, Dispatch } from '../types';
import { isAlreadyClaimed } from '../guards';

export function signupBonus(state: RRState, dispatch: Dispatch): void {
  if (isAlreadyClaimed(state, 'Welkomstbonus')) return;
  dispatch({
    type: 'APPLY_TRIGGER',
    payload: { name: 'Welkomstbonus', cat: 'Lifecycle', base: 1000, kind: 'pos', catalogueKey: 'Welkomstbonus' },
  });
}

export function appActivated(state: RRState, dispatch: Dispatch): void {
  if (isAlreadyClaimed(state, 'App geactiveerd')) return;
  dispatch({
    type: 'APPLY_TRIGGER',
    payload: { name: 'App geactiveerd', cat: 'App & Data', base: 150, kind: 'pos', catalogueKey: 'App geactiveerd' },
  });
}

export function renewContract(state: RRState, dispatch: Dispatch): void {
  if (isAlreadyClaimed(state, 'Contract verlengd (1 jaar)')) return;
  dispatch({
    type: 'APPLY_TRIGGER',
    payload: { name: 'Contract verlengd (1 jaar)', cat: 'Contract & Lifecycle', base: 400, kind: 'pos', catalogueKey: 'Contract verlengd (1 jaar)' },
  });
}
