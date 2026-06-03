import type { RRState, MonthData, HarvestCell, LedgerEntry, TierKey, CatalogueItemStatus, Profile } from './types';
import { computeOnboardingRewards } from './services/onboarding';
import { simulateDailyUsage } from './services/usageSimulator';

function buildHarvestMonthsData(): MonthData[] {
  const year = 2026;
  const months = [3, 4, 5, 6, 7, 8];
  const today = new Date(2026, 5, 3);

  return months.map(m => {
    const first = new Date(year, m, 1);
    const totalDays = new Date(year, m + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7;
    const cells: HarvestCell[] = [];

    for (let i = 0; i < lead; i++) cells.push(null);

    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, m, d);
      const dow = date.getDay();
      const weekend = dow === 0 || dow === 6;
      // Clean slate: nothing earned/missed yet. Past weekends are 'none', future 'upcoming'.
      let state: 'none' | 'earned' | 'missed' | 'upcoming' = 'none';
      if (weekend && date >= today) state = 'upcoming';
      cells.push({ d, weekend, state, today: date.getTime() === today.getTime() });
    }

    return { m, cells };
  });
}

const harvestMonthsData = buildHarvestMonthsData();

export const baseInitialState: RRState = {
  user: { name: 'Jan', fullName: 'Jan de Vries' },
  balance: 0,
  cap: 10000,
  multiplier: 1,
  period: { startLabel: '1 jan 2026', endLabel: '31 dec 2026', daysLeft: 211 },

  tiers: [
    { id: 'seed',   emoji: '🌱', name: 'Zaad', nameEn: 'Seed',   en: 'Seed',   min: 0,    max: 2499, mult: '1×',   routes: ['Standaard startpunt voor elk lid'],                                                                              routesEn: ['Standard starting point for every member'] },
    { id: 'tree',   emoji: '🌳', name: 'Boom', nameEn: 'Tree',   en: 'Tree',   min: 2500, max: 5999, mult: '1,5×', routes: ['2.500 seeds verzameld', 'of 12 maanden actief klant'],                                                           routesEn: ['2,500 seeds collected', 'or 12 months as an active customer'] },
    { id: 'forest', emoji: '🌲', name: 'Bos',  nameEn: 'Forest', en: 'Forest', min: 6000, max: null, mult: '2×',   routes: ['6.000 seeds verzameld', 'of 2+ producten + zonnepanelen', 'of 36 maanden actief klant'], routesEn: ['6,000 seeds collected', 'or 2+ products + solar panels', 'or 36 months as an active customer'] },
  ],
  currentTier: 'seed',
  nextTier: { name: 'Boom', nameEn: 'Tree', threshold: 2500 },

  ledger: [],

  catalogue: [
    { cat: 'Contract & Lifecycle', catEn: 'Contract & Lifecycle', items: [
      { name: 'Welkomstbonus',              nameEn: 'Welcome bonus',             seeds: 1000, status: 'available' },
      { name: 'Boom-tier bereikt',          nameEn: 'Tree tier reached',         seeds: 250,  status: 'available' },
      { name: 'Contract verlengd (1 jaar)', nameEn: 'Contract renewed (1 year)', seeds: 400,  status: 'available' },
      { name: '5 jaar trouw lid',           nameEn: '5 years loyal member',      seeds: 1500, status: 'locked', need: 'Word lid voor 5 jaar — nog 4 jaar te gaan', needEn: 'Become a member for 5 years — 4 years to go' },
    ]},
    { cat: 'App & Data', catEn: 'App & Data', items: [
      { name: 'App geactiveerd',         nameEn: 'App activated',              seeds: 150, status: 'available' },
      { name: 'Maandelijkse meterstand', nameEn: 'Monthly meter reading',      seeds: 20,  status: 'available' },
      { name: 'Pushmeldingen aangezet',  nameEn: 'Push notifications enabled', seeds: 50,  status: 'available' },
    ]},
    { cat: 'Harvest Hours', catEn: 'Harvest Hours', items: [
      { name: 'Oogstdag — gratis stroom', nameEn: 'Harvest day — free electricity', seeds: 10,  status: 'available' },
      { name: 'Oogstdag — verschuiving',  nameEn: 'Harvest day — shift',            seeds: 20,  status: 'available' },
      { name: 'Volledig oogstseizoen',    nameEn: 'Full harvest season',            seeds: 300, status: 'locked', need: 'Verzamel oogstdagen het hele seizoen (apr–sep)', needEn: 'Collect harvest days throughout the season (Apr–Sep)' },
    ]},
    { cat: 'Energiegedrag', catEn: 'Energy behaviour', items: [
      { name: 'Slimme thermostaat gekoppeld', nameEn: 'Smart thermostat connected', seeds: 200, status: 'available' },
      { name: 'Verbruik onder gemiddelde',    nameEn: 'Consumption below average',  seeds: 120, status: 'available' },
      { name: 'Remote uitlezing uitgezet',    nameEn: 'Remote reading disabled',    seeds: 60, status: 'available', need: 'Gemiste oogst: zet remote uitlezing aan om deze 60 zaden niet te missen', needEn: 'Missed harvest: enable remote reading so you don’t miss these 60 seeds' },
    ]},
    { cat: 'Multi-product', catEn: 'Multi-product', items: [
      { name: 'Tweede product: Internet',    nameEn: 'Second product: Internet', seeds: 500, status: 'available' },
      { name: 'Derde product: Verzekering',  nameEn: 'Third product: Insurance', seeds: 750, status: 'locked', need: 'Voeg een derde Budget Thuis-product toe', needEn: 'Add a third Budget Thuis product' },
      { name: 'Zonnepanelen geregistreerd',  nameEn: 'Solar panels registered',  seeds: 600, status: 'available' },
    ]},
  ],

  harvestSeason: { year: 2026, months: [3, 4, 5, 6, 7, 8], todayMonth: 5, todayDate: 3 },

  harvest: {
    optedIn: true,
    daysEarned: 0,
    seasonSeeds: 0,
    seedsPerDay: 10,
    year: 2026,
    months: [3, 4, 5, 6, 7, 8],
    monthsData: harvestMonthsData,
  },

  remoteReadEnabled: true,

  usages: {
    '2026-06-03': { // app "today" — matches harvestSeason
      date: '2026-06-03',
      generatedAt: new Date().toISOString(),
      hasHomeBattery: false,
      hours: simulateDailyUsage({ hasHomeBattery: false }),
    },
  },
  currentUsageDate: '2026-06-03',
  awardedWeekends: [],
  historyUnseen: false,
  pendingReward: null,
};

function fakeDateFor(idx: number, total: number): string {
  const startMs = new Date(2026, 0, 1).getTime();
  const endMs   = new Date(2026, 4, 31).getTime();
  const t = total <= 1 ? 0 : idx / (total - 1);
  return new Date(startMs + t * (endMs - startMs))
    .toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Rebuild the ledger from the active catalogue items — those the customer has
 * claimed (earned) or missed — spread across fake Jan–May 2026 dates and ordered
 * newest-first. `idOffset` keeps ids unique when onboarding entries are also
 * present. A missed item's seeds are shown as the amount missed; only claimed
 * items count toward the balance (computed separately).
 */
function buildLedgerFromCatalogue(catalogue: RRState['catalogue'], idOffset: number): LedgerEntry[] {
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

function readProfile(): Profile | null {
  try {
    const raw = localStorage.getItem('rr-profile');
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (typeof p !== 'object' || p === null) return null;
    return {
      solarPanels: !!p.solarPanels,
      homeBattery: !!p.homeBattery,
      householdSize: Number(p.householdSize) || 0,
      customerYears: Number(p.customerYears) || 0,
      products: Array.isArray(p.products) ? p.products : [],
    };
  } catch {
    return null;
  }
}

function deriveTier(balance: number): {
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

export function loadFromConfig(base: RRState): RRState {
  const profile = readProfile();

  let catalogue = base.catalogue;
  let catalogueBalance = 0;

  try {
    const saved = localStorage.getItem('rr-config');
    if (saved) {
      const parsed = JSON.parse(saved) as {
        catalogue: { name: string; status: CatalogueItemStatus }[];
      };
      if (Array.isArray(parsed.catalogue)) {
        const overrides = parsed.catalogue;
        catalogue = base.catalogue.map(cat => ({
          ...cat,
          items: cat.items.map(item => {
            const override = overrides.find(o => o.name === item.name);
            return override ? { ...item, status: override.status } : item;
          }),
        }));
        // Only claimed (earned) items count toward the balance; missed harvests
        // are informational and never affect it.
        catalogueBalance = catalogue.flatMap(c => c.items)
          .filter(i => i.status === 'claimed')
          .reduce((sum, i) => sum + i.seeds, 0);
      }
    }
  } catch {
    // malformed rr-config: ignore, fall back to base catalogue
    catalogue = base.catalogue;
    catalogueBalance = 0;
  }

  const onboarding = profile ? computeOnboardingRewards(profile) : { entries: [], total: 0 };

  // No config and no profile → return base untouched (preserves referential expectations).
  if (catalogueBalance === 0 && catalogue === base.catalogue && onboarding.entries.length === 0) {
    return base;
  }

  const balance = Math.min(base.cap, Math.max(0, catalogueBalance + onboarding.total));
  const { currentTier, multiplier, nextTier } = deriveTier(balance);

  // Rebuild the ledger from whatever drove this state: claimed/missed catalogue
  // items (only when an rr-config was applied) plus any onboarding rewards. The
  // static base ledger is intentionally replaced so history matches the live balance.
  const configApplied = catalogue !== base.catalogue;
  const catalogueLedger = configApplied
    ? buildLedgerFromCatalogue(catalogue, onboarding.entries.length)
    : [];
  const ledger = [...catalogueLedger, ...onboarding.entries];

  return { ...base, catalogue, balance, currentTier, multiplier, nextTier, ledger };
}

export const initialState: RRState = loadFromConfig(baseInitialState);
