import type { RRState, RRAction, TierKey, LedgerEntry, CatalogueCategory } from './types';
import { computeOnboardingRewards } from './services/onboarding';
import { formatDate } from './format';
// harvestWeekend helpers are still used by harvest.jsx; the reducer uses per-day logic only.
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

    // Per-day harvest: every simulated weekend day is processed exactly once.
    // Electricity ownership (gratis stroom) is the only gate — no green-hours
    // check needed; if you participate you earn, if you don't own electricity
    // the day is logged as a missed harvest.
    const date = action.payload.date;
    if (!state.awardedHarvestDays.includes(date)) {
      const d   = new Date(`${date}T00:00:00`);
      const dow = d.getDay(); // 0 = Sun, 6 = Sat
      if (dow === 0 || dow === 6) {
        const electricity = hasElectricity(state.catalogue);
        const kind: 'pos' | 'missed' = electricity ? 'pos' : 'missed';

        const MONTHS_NL = ['januari','februari','maart','april','mei','juni','juli',
          'augustus','september','oktober','november','december'];
        const MONTHS_EN = ['January','February','March','April','May','June','July',
          'August','September','October','November','December'];
        const dayNL = `${d.getDate()} ${MONTHS_NL[d.getMonth()]}`;
        const dayEN = `${d.getDate()} ${MONTHS_EN[d.getMonth()]}`;

        const { patch, entry } = applyEarning(next, {
          name:   `Oogstdag ${dayNL}`,
          nameEn: `Harvest day ${dayEN}`,
          cat:    'Harvest Hours',
          base:   next.harvest.seedsPerDay, // 10 seeds per day
          kind,
        }, 1); // fixed 1× — harvest days use the configured value, not tier multiplier

        next = {
          ...next,
          ...patch,
          awardedHarvestDays: [...state.awardedHarvestDays, date],
          harvest: electricity ? applyHarvestDate(next.harvest, date, 1) : next.harvest,
          historyUnseen: true,
          pendingReward: electricity
            ? { amount: entry.amount, weekend: dayNL, weekendEn: dayEN }
            : next.pendingReward,
        };
      }
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
  if (action.type === 'UPDATE_LEDGER_ENTRY') {
    const existing = state.ledger.find(e => e.id === action.id);
    if (!existing) return state;
    const delta      = action.amount - existing.amount;
    const newBalance = Math.min(state.cap, Math.max(0, state.balance + delta));
    const newTier    = evaluateTier(newBalance, state.currentTier);
    return {
      ...state,
      balance:     newBalance,
      currentTier: newTier,
      multiplier:  TIER_MULTIPLIERS[newTier],
      nextTier:    nextTierFor(newTier, state.tiers),
      ledger:      state.ledger.map(e =>
        e.id === action.id ? { ...e, base: action.base, amount: action.amount } : e
      ),
    };
  }
  if (action.type === 'SELECT_EXCLUSIVE') {
    const category = state.catalogue.find(c => c.cat === action.cat);
    const target = category?.items.find(i => i.name === action.catalogueKey);
    if (!category || !target || !target.group || target.status === 'claimed') return state;

    // The currently-claimed sibling (if any) is swapped out; balance moves by the
    // net difference so only one option in the group ever counts.
    const claimedSiblings = category.items.filter(
      i => i.group === target.group && i.status === 'claimed' && i.name !== target.name
    );
    const removed = claimedSiblings.reduce((s, i) => s + i.seeds, 0);
    const newBalance = Math.min(state.cap, Math.max(0, state.balance + target.seeds - removed));
    const newTier = evaluateTier(newBalance, state.currentTier);

    const catalogue = state.catalogue.map(c =>
      c.cat !== action.cat ? c : {
        ...c,
        items: c.items.map(i => {
          if (i.name === target.name) return { ...i, status: 'claimed' as const };
          if (i.group === target.group && i.status === 'claimed') return { ...i, status: 'available' as const };
          return i;
        }),
      }
    );

    // Drop the swapped-out sibling's ledger row and record the newly-selected one.
    const siblingNames = new Set(claimedSiblings.map(s => s.name));
    const prunedLedger = state.ledger.filter(e => !siblingNames.has(e.name));
    const entry: LedgerEntry = {
      id: nextLedgerId(prunedLedger),
      name: target.name,
      nameEn: target.nameEn,
      cat: action.cat,
      date: formatDate(),
      base: target.seeds,
      mult: 1,
      amount: target.seeds,
      kind: 'pos',
    };

    return {
      ...state,
      balance: newBalance,
      currentTier: newTier,
      multiplier: TIER_MULTIPLIERS[newTier],
      nextTier: nextTierFor(newTier, state.tiers),
      catalogue,
      ledger: [entry, ...prunedLedger],
      historyUnseen: true,
    };
  }
  if (action.type === 'RENEW_PRODUCT') {
    if (state.renewals.includes(action.product)) return state;
    // Award the renewal at its fixed value (no tier multiplier).
    const { patch, entry } = applyEarning(state, {
      name: action.name,
      nameEn: action.nameEn,
      cat: 'Contract & Lifecycle',
      base: action.seeds,
      kind: 'pos',
    }, 1);
    return {
      ...state,
      ...patch,
      renewals: [...state.renewals, action.product],
      pendingRenewal: { product: action.product, name: action.name, nameEn: action.nameEn, seeds: entry.amount },
    };
  }
  if (action.type === 'DISMISS_RENEWAL') {
    return state.pendingRenewal ? { ...state, pendingRenewal: null } : state;
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

  return {
    ...state,
    ...patch,
    catalogue: newCatalogue,
    harvest: newHarvest,
    remoteReadEnabled: setRemoteRead !== undefined ? setRemoteRead : state.remoteReadEnabled,
    // Keep awardedHarvestDays in sync when a harvest day is triggered manually.
    awardedHarvestDays: harvestDate && !state.awardedHarvestDays.includes(harvestDate)
      ? [...state.awardedHarvestDays, harvestDate]
      : state.awardedHarvestDays,
  };
}
