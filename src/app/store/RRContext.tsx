import { createContext, useContext, useReducer, useEffect, useRef, type ReactNode } from 'react';
import type { RRState, Dispatch, CatalogueItem, Profile } from './types';
import { initialState } from './initialState';
import { reducer } from './reducer';
import { signupBonus, appActivated, renewContract } from './services/lifecycle';
import { optInGratisStroom, optInRenewalComms, optInAnalytics, toggleRemoteRead } from './services/appData';
import { harvestHoursEarned } from './services/harvestHours';
import { addProduct } from './services/multiProduct';
import { registerSolarPanels } from './services/energyBehaviour';
import { simulateUsage, selectUsageDate, type SimulateUsageParams } from './services/usage';

type RRContextType = {
  state: RRState;
  dispatch: Dispatch;
};

const RRContext = createContext<RRContextType | null>(null);

export function RRProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const overrides = state.catalogue.flatMap(cat =>
      cat.items.map(i => ({ name: i.name, status: i.status }))
    );
    localStorage.setItem('rr-config', JSON.stringify({ catalogue: overrides }));
  }, [state.catalogue]);

  // ── helpers ──────────────────────────────────────────────────
  function getUid(): string {
    let uid = localStorage.getItem('rr-uid');
    if (!uid) { uid = crypto.randomUUID(); localStorage.setItem('rr-uid', uid); }
    return uid;
  }
  function postLive(seeds: number, label: string, labelEn?: string) {
    const uid  = getUid();
    const user = localStorage.getItem('rr-name') || 'Customer';
    fetch('/api/live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, user, seeds, label, labelEn }),
    }).catch(() => { /* silent fail in dev / when API not set up */ });
  }

  // ── 1. Broadcast ALL new positive ledger entries ─────────────
  // When onboarding fires, multiple entries land at once — loop them all.
  const prevLedgerLen = useRef(state.ledger.length);
  useEffect(() => {
    const prev = prevLedgerLen.current;
    prevLedgerLen.current = state.ledger.length;
    const newCount = state.ledger.length - prev;
    if (newCount <= 0) return;

    for (let i = 0; i < newCount; i++) {
      const entry = state.ledger[i]; // ledger is newest-first
      if (entry?.kind === 'pos') postLive(entry.amount, entry.name, entry.nameEn);
    }
  }, [state.ledger]);

  // ── 2. Initial balance sync ───────────────────────────────────
  // Fires once when the user first gets a name (onboarding complete).
  // Sends their full current balance so the live dashboard starts accurate.
  const initialSyncDone = useRef(!!localStorage.getItem('rr-live-synced'));
  useEffect(() => {
    const name = localStorage.getItem('rr-name');
    if (!name || initialSyncDone.current || state.balance <= 0) return;
    initialSyncDone.current = true;
    localStorage.setItem('rr-live-synced', '1');
    postLive(state.balance, 'App gestart', 'App started');
  }, [state.balance]);

  return <RRContext.Provider value={{ state, dispatch }}>{children}</RRContext.Provider>;
}

export function useRR(): RRState {
  const ctx = useContext(RRContext);
  if (!ctx) throw new Error('useRR must be used inside RRProvider');
  return ctx.state;
}

export function useTrigger() {
  const ctx = useContext(RRContext);
  if (!ctx) throw new Error('useTrigger must be used inside RRProvider');
  const { state, dispatch } = ctx;

  return {
    signupBonus:         ()                               => signupBonus(state, dispatch),
    appActivated:        ()                               => appActivated(state, dispatch),
    renewContract:       ()                               => renewContract(state, dispatch),
    optInGratisStroom:   ()                               => optInGratisStroom(state, dispatch),
    optInRenewalComms:   ()                               => optInRenewalComms(state, dispatch),
    optInAnalytics:      ()                               => optInAnalytics(state, dispatch),
    toggleRemoteRead:    (enabled: boolean)               => toggleRemoteRead(enabled, state, dispatch),
    harvestHoursEarned:  (date: string, optedIn: boolean) => harvestHoursEarned(date, optedIn, state, dispatch),
    addProduct:          (productName: string)             => addProduct(productName, state, dispatch),
    registerSolarPanels: ()                               => registerSolarPanels(state, dispatch),
    applyOnboarding:     (profile: Profile)               => dispatch({ type: 'APPLY_ONBOARDING', profile }),
    simulateUsage:       (params: SimulateUsageParams = {})  => simulateUsage(params, dispatch),
    selectUsageDate:     (date: string)                      => selectUsageDate(date, dispatch),
    markHistorySeen:     ()                                  => dispatch({ type: 'MARK_HISTORY_SEEN' }),
    dismissReward:       ()                                  => dispatch({ type: 'DISMISS_REWARD' }),
    dismissTierUp:       ()                                  => dispatch({ type: 'DISMISS_TIER_UP' }),
    renewProduct:        (product: string, name: string, nameEn: string, seeds: number) =>
                                                                dispatch({ type: 'RENEW_PRODUCT', product, name, nameEn, seeds }),
    dismissRenewal:      ()                                  => dispatch({ type: 'DISMISS_RENEWAL' }),
    claimItem:           (item: CatalogueItem, cat: string)  => {
      // Mutually-exclusive group (e.g. internet speed, mobile bundle): selecting
      // one swaps out the current sibling instead of stacking.
      if (item.group) {
        if (item.status === 'claimed') return;
        dispatch({ type: 'SELECT_EXCLUSIVE', cat, catalogueKey: item.name });
        return;
      }
      if (item.status !== 'available') return;
      dispatch({
        type: 'APPLY_TRIGGER',
        payload: {
          name: item.name,
          nameEn: item.nameEn,
          cat,
          base: item.seeds,
          kind: 'pos',
          catalogueKey: item.name,
        },
      });
    },
    /** Record a monthly usage-vs-average result. Updates the existing entry for
     *  the same month rather than adding a duplicate to the ledger. */
    logComparison: (seeds: number, kind: 'pos' | 'missed', monthLabel: string) => {
      const name   = `Verbruik vs. gemiddelde (${monthLabel})`;
      const nameEn = `Usage vs. average (${monthLabel})`;
      const existing = state.ledger.find(e => e.name === name);
      if (existing) {
        // Re-claim for same month: patch the entry and adjust balance by delta.
        const amount = Math.round(seeds * state.multiplier);
        dispatch({ type: 'UPDATE_LEDGER_ENTRY', id: existing.id, base: seeds, amount });
      } else {
        dispatch({
          type: 'APPLY_TRIGGER',
          payload: { name, nameEn, cat: 'Energiegedrag', base: seeds, kind },
        });
      }
    },
    /** Activate a missed Multi-product item (add a product the customer doesn't currently own). */
    activateProduct:     (item: CatalogueItem, cat: string)  => {
      if (item.status !== 'missed') return;
      dispatch({
        type: 'APPLY_TRIGGER',
        payload: {
          name: item.name,
          nameEn: item.nameEn,
          cat,
          base: item.seeds,
          kind: 'pos',
          catalogueKey: item.name,
        },
      });
    },
    /** Award seeds directly from a gamified notification event. */
    claimNotification: (name: string, nameEn: string, cat: string, seeds: number) =>
      dispatch({
        type: 'APPLY_TRIGGER',
        payload: { name, nameEn, cat, base: seeds, kind: 'pos' },
      }),
  };
}
