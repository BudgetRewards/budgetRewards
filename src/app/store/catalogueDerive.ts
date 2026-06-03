import type { RRState, CatalogueCategory, LedgerEntry, TierKey, Profile } from './types';

/** Maps onboarding product ids (from the OnboardingModal) to their Multi-product catalogue item names. */
export const PRODUCT_ITEM_NAMES: Record<string, string> = {
  electricity: 'Stroom',
  gas: 'Gas',
  internet: 'Internet',
  tv: 'TV',
  mobile: 'Mobiel',
  landline: 'Vaste lijn',
};

const ITEM_TO_PRODUCT: Record<string, string> = Object.fromEntries(
  Object.entries(PRODUCT_ITEM_NAMES).map(([id, name]) => [name, id])
);

const HARVEST_CAT = 'Harvest Hours';

/** A profile that owns nothing — used as the default before onboarding, so every
 *  product starts as a missed harvest (and the Welcome bonus is still claimed). */
export const EMPTY_PROFILE: Profile = {
  solarPanels: false,
  homeBattery: false,
  householdSize: 0,
  customerYears: 0,
  products: [],
};

/** True when the customer owns electricity — the 'Stroom' item is claimed. */
export function hasElectricity(catalogue: CatalogueCategory[]): boolean {
  return catalogue.some(cat =>
    cat.items.some(i => i.name === 'Stroom' && i.status === 'claimed')
  );
}

/**
 * Map an onboarding profile onto the catalogue:
 * - The Welcome bonus is always claimed (you have it by default).
 * - Each utility product is 'claimed' if owned, otherwise a missed harvest.
 * - Solar panels follow the profile's solarPanels answer.
 * Harvest gating is applied separately by {@link applyHarvestGate}.
 */
export function applyProfileToCatalogue(
  catalogue: CatalogueCategory[],
  profile: Profile,
): CatalogueCategory[] {
  const owned = new Set(profile.products);
  return catalogue.map(cat => ({
    ...cat,
    items: cat.items.map(item => {
      if (item.name === 'Welkomstbonus') return { ...item, status: 'claimed' as const };
      const productId = ITEM_TO_PRODUCT[item.name];
      if (productId) return { ...item, status: owned.has(productId) ? ('claimed' as const) : ('missed' as const) };
      if (item.name === 'Zonnepanelen geregistreerd') {
        return { ...item, status: profile.solarPanels ? ('claimed' as const) : ('missed' as const) };
      }
      return item;
    }),
  }));
}

/**
 * Without electricity, every Harvest Hours opportunity becomes a missed harvest:
 * any available or claimed harvest item flips to 'missed' (locked items stay
 * locked). With electricity, the catalogue is returned unchanged.
 */
export function applyHarvestGate(catalogue: CatalogueCategory[]): CatalogueCategory[] {
  if (hasElectricity(catalogue)) return catalogue;
  return catalogue.map(cat =>
    cat.cat !== HARVEST_CAT ? cat : {
      ...cat,
      items: cat.items.map(item =>
        item.status === 'available' || item.status === 'claimed'
          ? { ...item, status: 'missed' as const }
          : item
      ),
    }
  );
}

/** Sum of seeds from claimed items only; missed harvests never count toward the balance. */
export function claimedBalance(catalogue: CatalogueCategory[]): number {
  return catalogue.flatMap(c => c.items)
    .filter(i => i.status === 'claimed')
    .reduce((sum, i) => sum + i.seeds, 0);
}

/** A fake date spread across Jan–May 2026 so rebuilt ledger rows look chronological. */
export function fakeDateFor(idx: number, total: number): string {
  const startMs = new Date(2026, 0, 1).getTime();
  const endMs   = new Date(2026, 4, 31).getTime();
  const t = total <= 1 ? 0 : idx / (total - 1);
  return new Date(startMs + t * (endMs - startMs))
    .toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Rebuild the ledger from the active catalogue items — those the customer has
 * claimed (earned) or missed — newest-first. `idOffset` keeps ids unique when
 * onboarding bonus entries are also present. A missed item's seeds are shown as
 * the amount missed; only claimed items count toward the balance.
 */
export function buildLedgerFromCatalogue(catalogue: CatalogueCategory[], idOffset: number): LedgerEntry[] {
  const activeItems: { name: string; nameEn?: string; cat: string; seeds: number; missed: boolean }[] = [];
  for (const cat of catalogue) {
    for (const item of cat.items) {
      if (item.status === 'claimed' || item.status === 'missed') {
        activeItems.push({ name: item.name, nameEn: item.nameEn, cat: cat.cat, seeds: item.seeds, missed: item.status === 'missed' });
      }
    }
  }

  return activeItems
    .map((item, idx) => ({
      id: idOffset + idx + 1,
      name: item.name,
      nameEn: item.nameEn,
      cat: item.cat,
      date: fakeDateFor(idx, activeItems.length),
      base: item.seeds,
      mult: 1,
      amount: item.seeds,
      kind: (item.missed ? 'missed' : 'pos') as 'pos' | 'missed',
    }))
    .reverse();
}

/** Derive tier, multiplier, and next-tier target from a balance. */
export function deriveTier(balance: number): {
  currentTier: TierKey;
  multiplier: number;
  nextTier: RRState['nextTier'];
} {
  const currentTier: TierKey = balance >= 6000 ? 'forest' : balance >= 2500 ? 'tree' : 'seed';
  const multiplier = currentTier === 'forest' ? 2 : currentTier === 'tree' ? 1.5 : 1;
  const nextTier =
    currentTier === 'forest' ? null :
    currentTier === 'tree'   ? { name: 'Bos',  nameEn: 'Forest', threshold: 6000 } :
                                { name: 'Boom', nameEn: 'Tree',   threshold: 2500 };
  return { currentTier, multiplier, nextTier };
}
