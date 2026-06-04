import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
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
    claimItem:           (item: CatalogueItem, cat: string)  => {
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
    /** Record a daily usage-vs-average comparison result in the ledger. */
    logComparison: (seeds: number, kind: 'pos' | 'missed', dateLabel: string) =>
      dispatch({
        type: 'APPLY_TRIGGER',
        payload: {
          name:   `Verbruik vs. 2-pers. gemiddelde (${dateLabel})`,
          nameEn: `Usage vs. 2-person average (${dateLabel})`,
          cat:    'Energiegedrag',
          base:   seeds,
          kind,
        },
      }),
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
  };
}
