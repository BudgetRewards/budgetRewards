import type { RRState, RRAction, TierKey, LedgerEntry, CatalogueCategory } from './types';
import { computeOnboardingRewards } from './services/onboarding';
import { formatDate } from './format';
import { weekendFor, isWeekendEarned, weekendLabels, weekendRewardSeeds } from './services/harvestWeekend';
import { baseInitialState } from './initialState';
import {
  applyProfileToCatalogue,
  applyHarvestGate,
  claimedBalance,
  buildLedgerFromCatalogue,
  hasElectricity,
  unlockProductBonuses,
  restoreHarvestIfElectricity,
  MULTI_PRODUCT_ITEM_NAMES,
} from './catalogueDerive';

export const TIER_MULTIPLIERS: Record<TierKey, number> = {
  seed: 1,
  tree: 1.5,
  forest: 2,
};

const TIER_ORDER: TierKey[] = ['seed', 'tree', 'forest'];

const TIER_THRESHOLDS: { tier: TierKey; min: number }[] = [
  { tier: 'forest', min: 6000 },
  { tier: 'tree', min: 2500 },
  { tier: 'seed', min: 0 },
];

function evaluateTier(balance: number, current: TierKey): TierKey {
  for (const { tier, min } of TIER_THRESHOLDS) {
    if (balance >= min) {
      return TIER_ORDER.indexOf(tier) > TIER_ORDER.indexOf(current) ? tier : current;
    }
  }
  return current;
}

/** Returns the crossing when newTier is a higher tier than oldTier, else null. */
function tierUpFor(oldTier: TierKey, newTier: TierKey): { from: TierKey; to: TierKey } | null {
  return TIER_ORDER.indexOf(newTier) > TIER_ORDER.indexOf(oldTier)
    ? { from: oldTier, to: newTier }
    : null;
}

function nextTierFor(tier: TierKey, tiers: RRState['tiers']): RRState['nextTier'] {
  const idx = TIER_ORDER.indexOf(tier);
  if (idx >= TIER_ORDER.length - 1) return null;
  const nextId = TIER_ORDER[idx + 1];
  const def = tiers.find(t => t.id === nextId);
  return def ? { name: def.name, nameEn: def.nameEn, threshold: def.min } : null;
}

function applyCatalogueKey(
  catalogue: CatalogueCategory[],
  key: string,
): CatalogueCategory[] {
  return catalogue.map(cat => ({
    ...cat,
    items: cat.items.map(item =>
      item.name === key ? { ...item, status: 'claimed' as const } : item
    ),
  }));
}

function applyRemoteReadCatalogue(
  catalogue: CatalogueCategory[],
  enabled: boolean,
): CatalogueCategory[] {
  return catalogue.map(cat => ({
    ...cat,
    items: cat.items.map(item =>
      item.name === 'Remote uitlezing uitgezet'
        ? { ...item, status: enabled ? ('available' as const) : ('missed' as const) }
        : item
    ),
  }));
}

function applyHarvestDate(
  harvest: RRState['harvest'],
  harvestDate: string,
  multiplier: number,
): RRState['harvest'] {
  const [, month, day] = harvestDate.split('-').map(Number);
  const m = month - 1; // JS months are 0-indexed
  const d = day;

  const monthsData = harvest.monthsData.map(mo =>
    mo.m === m
      ? {
          ...mo,
          cells: mo.cells.map(cell =>
            cell && cell.d === d ? { ...cell, state: 'earned' as const } : cell
          ),
        }
      : mo
  );

  let earned = 0;
  monthsData.forEach(mo =>
    mo.cells.forEach(cell => { if (cell && cell.state === 'earned') earned++; })
  );

  return {
    ...harvest,
    daysEarned: earned,
    seasonSeeds: Math.round(earned * harvest.seedsPerDay * multiplier),
    monthsData,
  };
}

function nextLedgerId(ledger: RRState['ledger']): number {
  return ledger.length > 0 ? Math.max(...ledger.map(e => e.id)) + 1 : 1;
}

type EarningInput = {
  name: string;
  nameEn?: string;
  cat: string;
  base: number;
  kind: 'pos' | 'missed';
};

/**
 * Apply a seed earning or a missed harvest: append a ledger entry and recompute
 * balance, tier, and multiplier. A 'missed' entry is purely informational — it
 * records the seeds the customer missed out on but never changes the balance
 * (the tier multiplier also does not apply, since nothing was actually earned).
 * Returns the changed state fields plus the new entry (so callers can read the
 * awarded amount). Shared by APPLY_TRIGGER and the weekend reward.
 */
function applyEarning(state: RRState, input: EarningInput, multiplier?: number): {
  patch: Pick<RRState, 'balance' | 'multiplier' | 'currentTier' | 'nextTier' | 'ledger'>;
  entry: LedgerEntry;
} {
  const missed = input.kind === 'missed';
  // Missed harvests are recorded at face value (no tier multiplier). Otherwise
  // most earnings use the tier multiplier, but callers may pass an explicit
  // multiplier (e.g. 1) for rewards awarded at a fixed, configured value.
  const mult = missed ? 1 : (multiplier ?? TIER_MULTIPLIERS[state.currentTier]);
  const amount = Math.round(input.base * mult);

  const entry: LedgerEntry = {
    id: nextLedgerId(state.ledger),
    name: input.name,
    nameEn: input.nameEn,
    cat: input.cat,
    date: formatDate(),
    base: input.base,
    mult,
    amount,
    kind: input.kind,
  };

  const balanceDelta = missed ? 0 : amount;
  const newBalance = Math.min(state.cap, Math.max(0, state.balance + balanceDelta));
  const newTier = evaluateTier(newBalance, state.currentTier);

  return {
    patch: {
      balance: newBalance,
      multiplier: TIER_MULTIPLIERS[newTier],
      currentTier: newTier,
      nextTier: nextTierFor(newTier, state.tiers),
      ledger: [entry, ...state.ledger],
    },
    entry,
  };
}

export function reducer(state: RRState, action: RRAction): RRState {
  if (action.type === 'APPLY_ONBOARDING') {
    // The product picks decide which Multi-product items are claimed vs missed;
    // without electricity the Harvest Hours opportunities become missed too.
    // Derive from the pristine base catalogue so re-onboarding starts clean.
    const catalogue = applyHarvestGate(applyProfileToCatalogue(baseInitialState.catalogue, action.profile));
    const { entries: bonusEntries, total: bonusTotal } = computeOnboardingRewards(action.profile);
    const balance = Math.min(state.cap, Math.max(0, claimedBalance(catalogue) + bonusTotal));
    const tier = evaluateTier(balance, state.currentTier);
    const ledger = [...buildLedgerFromCatalogue(catalogue, bonusEntries.length), ...bonusEntries];
    return {
      ...state,
      catalogue,
      balance,
      ledger,
      currentTier: tier,
      multiplier: TIER_MULTIPLIERS[tier],
      nextTier: nextTierFor(tier, state.tiers),
    };
  }
  if (action.type === 'SET_USAGE') {
    const usages = { ...state.usages, [action.payload.date]: action.payload };
    let next: RRState = { ...state, usages, currentUsageDate: action.payload.date };

    // Award seeds when this simulation completes a weekend: both Saturday and
    // Sunday must have earned green hours, and the weekend not yet rewarded.
    const weekend = weekendFor(action.payload.date);
    if (weekend && !state.awardedWeekends.includes(weekend.id) && isWeekendEarned(weekend, usages)) {
      const labels = weekendLabels(weekend);
      // Without electricity the harvest is missed, not earned: it lands in the
      // history as a missed harvest and never adds to the balance.
      const earned = hasElectricity(state.catalogue);
      // Award the configured value as-is (no tier multiplier) so the points
      // shown on the harvest screen match exactly what lands in the history.
      const { patch, entry } = applyEarning(next, {
        name: `Oogstweekend ${labels.nl}`,
        nameEn: `Harvest weekend ${labels.en}`,
        cat: 'Harvest Hours',
        base: weekendRewardSeeds(state.catalogue) || 2 * state.harvest.seedsPerDay,
        kind: earned ? 'pos' : 'missed',
      }, 1);
      next = {
        ...next,
        ...patch,
        awardedWeekends: [...state.awardedWeekends, weekend.id],
        historyUnseen: true,
        // Only celebrate an actual earning; a missed weekend just shows in history.
        pendingReward: earned ? { amount: entry.amount, weekend: labels.nl, weekendEn: labels.en } : state.pendingReward,
      };
    }
    return next;
  }
  if (action.type === 'SELECT_USAGE_DATE') {
    if (!state.usages[action.payload.date]) return state;
    return { ...state, currentUsageDate: action.payload.date };
  }
  if (action.type === 'MARK_HISTORY_SEEN') {
    return state.historyUnseen ? { ...state, historyUnseen: false } : state;
  }
  if (action.type === 'DISMISS_REWARD') {
    return state.pendingReward ? { ...state, pendingReward: null } : state;
  }
  if (action.type === 'DISMISS_TIER_UP') {
    return state.pendingTierUp ? { ...state, pendingTierUp: null } : state;
  }
  if (action.type !== 'APPLY_TRIGGER') return state;

  const { name, nameEn, cat, base, kind, catalogueKey, harvestDate, setRemoteRead } = action.payload;

  // A zero-value trigger (e.g. re-enabling remote reading) only flips flags and
  // catalogue status — it must not add a ledger entry or move the balance.
  const patch = base === 0
    ? {}
    : applyEarning(state, { name, nameEn, cat, base, kind }).patch;

  let newCatalogue = state.catalogue;
  if (catalogueKey) {
    newCatalogue = applyCatalogueKey(newCatalogue, catalogueKey);
    // Activating a Multi-product item unlocks its bonus sub-category.
    if (MULTI_PRODUCT_ITEM_NAMES.has(catalogueKey)) {
      newCatalogue = unlockProductBonuses(newCatalogue, catalogueKey);
      // Gaining electricity also restores Harvest Hours that were missed due to the harvest gate.
      if (catalogueKey === 'Stroom') {
        newCatalogue = restoreHarvestIfElectricity(newCatalogue);
      }
    }
  }
  if (setRemoteRead !== undefined) newCatalogue = applyRemoteReadCatalogue(newCatalogue, setRemoteRead);

  const newHarvest = harvestDate
    ? applyHarvestDate(state.harvest, harvestDate, TIER_MULTIPLIERS[state.currentTier])
    : state.harvest;

  const newTierAfterTrigger = 'currentTier' in patch ? patch.currentTier : undefined;
  const triggerTierUp = newTierAfterTrigger
    ? tierUpFor(state.currentTier, newTierAfterTrigger)
    : null;

  return {
    ...state,
    ...patch,
    catalogue: newCatalogue,
    harvest: newHarvest,
    remoteReadEnabled: setRemoteRead !== undefined ? setRemoteRead : state.remoteReadEnabled,
    pendingTierUp: triggerTierUp ?? state.pendingTierUp,
  };
}
