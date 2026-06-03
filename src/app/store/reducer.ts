import type { RRState, RRAction, TierKey, LedgerEntry, CatalogueCategory } from './types';

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
  return def ? { name: def.name, threshold: def.min } : null;
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
  const date = new Date(harvestDate);
  const m = date.getMonth();
  const d = date.getDate();

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

export function reducer(state: RRState, action: RRAction): RRState {
  if (action.type !== 'APPLY_TRIGGER') return state;

  const { name, cat, base, kind, catalogueKey, harvestDate, setRemoteRead } = action.payload;

  const mult = TIER_MULTIPLIERS[state.currentTier];
  const amount = Math.round(base * mult);

  const entry: LedgerEntry = {
    id: nextLedgerId(state.ledger),
    name,
    cat,
    date: formatDate(),
    base,
    mult,
    amount,
    kind,
  };

  const newBalance = Math.min(state.cap, Math.max(0, state.balance + amount));
  const newTier = evaluateTier(newBalance, state.currentTier);
  const newMultiplier = TIER_MULTIPLIERS[newTier];
  const newNextTier = nextTierFor(newTier, state.tiers);

  let newCatalogue = state.catalogue;
  if (catalogueKey) newCatalogue = applyCatalogueKey(newCatalogue, catalogueKey);
  if (setRemoteRead !== undefined) newCatalogue = applyRemoteReadCatalogue(newCatalogue, setRemoteRead);

  const newHarvest = harvestDate
    ? applyHarvestDate(state.harvest, harvestDate, mult)
    : state.harvest;

  return {
    ...state,
    balance: newBalance,
    multiplier: newMultiplier,
    currentTier: newTier,
    nextTier: newNextTier,
    ledger: [entry, ...state.ledger],
    catalogue: newCatalogue,
    harvest: newHarvest,
    remoteReadEnabled: setRemoteRead !== undefined ? setRemoteRead : state.remoteReadEnabled,
  };
}
