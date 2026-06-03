import type { RRState, RRAction, TierKey, LedgerEntry, CatalogueCategory } from './types';
import { weekendFor, isWeekendEarned, weekendLabels } from './services/harvestWeekend';

const TIER_MULTIPLIERS: Record<TierKey, number> = {
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
        ? { ...item, status: enabled ? ('available' as const) : ('penalty' as const) }
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

function formatDate(): string {
  return new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function nextLedgerId(ledger: RRState['ledger']): number {
  return ledger.length > 0 ? Math.max(...ledger.map(e => e.id)) + 1 : 1;
}

type EarningInput = {
  name: string;
  nameEn?: string;
  cat: string;
  base: number;
  kind: 'pos' | 'neg';
};

/**
 * Apply a seed earning/penalty: append a ledger entry and recompute balance,
 * tier, and multiplier. Returns the changed state fields plus the new entry
 * (so callers can read the awarded amount). Shared by APPLY_TRIGGER and the
 * weekend reward.
 */
function applyEarning(state: RRState, input: EarningInput): {
  patch: Pick<RRState, 'balance' | 'multiplier' | 'currentTier' | 'nextTier' | 'ledger'>;
  entry: LedgerEntry;
} {
  const mult = TIER_MULTIPLIERS[state.currentTier];
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

  const newBalance = Math.min(state.cap, Math.max(0, state.balance + amount));
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
  if (action.type === 'SET_USAGE') {
    const usages = { ...state.usages, [action.payload.date]: action.payload };
    let next: RRState = { ...state, usages, currentUsageDate: action.payload.date };

    // Award seeds when this simulation completes a weekend: both Saturday and
    // Sunday must have earned green hours, and the weekend not yet rewarded.
    const weekend = weekendFor(action.payload.date);
    if (weekend && !state.awardedWeekends.includes(weekend.id) && isWeekendEarned(weekend, usages)) {
      const labels = weekendLabels(weekend);
      const { patch, entry } = applyEarning(next, {
        name: `Oogstweekend ${labels.nl}`,
        nameEn: `Harvest weekend ${labels.en}`,
        cat: 'Harvest Hours',
        base: 2 * state.harvest.seedsPerDay,
        kind: 'pos',
      });
      next = {
        ...next,
        ...patch,
        awardedWeekends: [...state.awardedWeekends, weekend.id],
        historyUnseen: true,
        pendingReward: { amount: entry.amount, weekend: labels.nl, weekendEn: labels.en },
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
  if (action.type !== 'APPLY_TRIGGER') return state;

  const { name, nameEn, cat, base, kind, catalogueKey, harvestDate, setRemoteRead } = action.payload;

  const { patch } = applyEarning(state, { name, nameEn, cat, base, kind });

  let newCatalogue = state.catalogue;
  if (catalogueKey) newCatalogue = applyCatalogueKey(newCatalogue, catalogueKey);
  if (setRemoteRead !== undefined) newCatalogue = applyRemoteReadCatalogue(newCatalogue, setRemoteRead);

  const newHarvest = harvestDate
    ? applyHarvestDate(state.harvest, harvestDate, TIER_MULTIPLIERS[state.currentTier])
    : state.harvest;

  return {
    ...state,
    ...patch,
    catalogue: newCatalogue,
    harvest: newHarvest,
    remoteReadEnabled: setRemoteRead !== undefined ? setRemoteRead : state.remoteReadEnabled,
  };
}
