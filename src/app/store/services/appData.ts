import type { RRState, Dispatch } from '../types';
import { isAlreadyClaimed } from '../guards';

export function optInGratisStroom(state: RRState, dispatch: Dispatch): void {
  if (isAlreadyClaimed(state, 'Oogstdag — gratis stroom')) return;
  dispatch({
    type: 'APPLY_TRIGGER',
    payload: { name: 'Opt-in: gratis stroom', cat: 'App & Data', base: 150, kind: 'pos', catalogueKey: 'Oogstdag — gratis stroom' },
  });
}

export function optInRenewalComms(state: RRState, dispatch: Dispatch): void {
  if (isAlreadyClaimed(state, 'Pushmeldingen aangezet')) return;
  dispatch({
    type: 'APPLY_TRIGGER',
    payload: { name: 'Opt-in: verlengingscommunicatie', cat: 'App & Data', base: 200, kind: 'pos', catalogueKey: 'Pushmeldingen aangezet' },
  });
}

export function optInAnalytics(state: RRState, dispatch: Dispatch): void {
  if (isAlreadyClaimed(state, 'Maandelijkse meterstand')) return;
  dispatch({
    type: 'APPLY_TRIGGER',
    payload: { name: 'Opt-in: app analytics', cat: 'App & Data', base: 50, kind: 'pos', catalogueKey: 'Maandelijkse meterstand' },
  });
}

export function toggleRemoteRead(enabled: boolean, state: RRState, dispatch: Dispatch): void {
  if (enabled === state.remoteReadEnabled) return;
  if (!enabled) {
    // Disabling remote reading means missing the 60-seed harvest — recorded as a
    // missed harvest (informational), not a penalty: the balance is unaffected.
    dispatch({
      type: 'APPLY_TRIGGER',
      payload: { name: 'Remote uitlezing uitgezet', cat: 'Energiegedrag', base: 60, kind: 'missed', setRemoteRead: false },
    });
  } else {
    // Re-enabling just makes the harvest available again — no balance change.
    dispatch({
      type: 'APPLY_TRIGGER',
      payload: { name: 'Remote uitlezing hersteld', cat: 'Energiegedrag', base: 0, kind: 'pos', setRemoteRead: true },
    });
  }
}
