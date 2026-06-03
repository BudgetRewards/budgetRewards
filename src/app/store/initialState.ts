import type { RRState, MonthData, HarvestCell, LedgerEntry, TierKey, CatalogueItemStatus } from './types';
import { simulateDailyUsage } from './services/usageSimulator';

function buildHarvestMonthsData(): MonthData[] {
  const year = 2026;
  const months = [3, 4, 5, 6, 7, 8];
  const today = new Date(2026, 5, 3);
  const missed = new Set(['3-25', '4-3', '4-17']);

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
      let state: 'none' | 'earned' | 'missed' | 'upcoming' = 'none';
      if (weekend) {
        if (date < today) state = missed.has(`${m}-${d}`) ? 'missed' : 'earned';
        else state = 'upcoming';
      }
      cells.push({ d, weekend, state, today: date.getTime() === today.getTime() });
    }

    return { m, cells };
  });
}

function countEarned(monthsData: MonthData[]): number {
  let count = 0;
  monthsData.forEach(mo =>
    mo.cells.forEach(c => { if (c && c.state === 'earned') count++; })
  );
  return count;
}

const SEEDS_PER_DAY = 10;
const harvestMonthsData = buildHarvestMonthsData();
const harvestDaysEarned = countEarned(harvestMonthsData);

export const baseInitialState: RRState = {
  user: { name: 'Jan', fullName: 'Jan de Vries' },
  balance: 2600,
  cap: 10000,
  multiplier: 1.5,
  period: { startLabel: '1 jan 2026', endLabel: '31 dec 2026', daysLeft: 211 },

  tiers: [
    { id: 'seed',   emoji: '🌱', name: 'Zaad', nameEn: 'Seed',   en: 'Seed',   min: 0,    max: 2499, mult: '1×',   routes: ['Standaard startpunt voor elk lid'],                                                                              routesEn: ['Standard starting point for every member'] },
    { id: 'tree',   emoji: '🌳', name: 'Boom', nameEn: 'Tree',   en: 'Tree',   min: 2500, max: 5999, mult: '1,5×', routes: ['2.500 seeds verzameld', 'of 12 maanden actief klant'],                                                           routesEn: ['2,500 seeds collected', 'or 12 months as an active customer'] },
    { id: 'forest', emoji: '🌲', name: 'Bos',  nameEn: 'Forest', en: 'Forest', min: 6000, max: null, mult: '2×',   routes: ['6.000 seeds verzameld', 'of 2+ producten + zonnepanelen', 'of 36 maanden actief klant'], routesEn: ['6,000 seeds collected', 'or 2+ products + solar panels', 'or 36 months as an active customer'] },
  ],
  currentTier: 'tree',
  nextTier: { name: 'Bos', nameEn: 'Forest', threshold: 6000 },

  // Harvest-hour entries are intentionally NOT seeded here — they are added to
  // the ledger only when a weekend is earned via simulated usage (see reducer
  // SET_USAGE → weekend reward).
  ledger: [
    { id: 2, name: 'Remote uitlezing uitgezet',       nameEn: 'Remote reading disabled',      cat: 'Energiegedrag', date: '24 mei 2026',  base: -60,  mult: 1.5, amount: -90,  kind: 'neg' },
    { id: 4, name: 'Maandelijkse meterstand',         nameEn: 'Monthly meter reading',        cat: 'App & Data',    date: '1 mei 2026',   base: 20,   mult: 1.5, amount: 30,   kind: 'pos' },
    { id: 5, name: 'Tweede product: Internet',        nameEn: 'Second product: Internet',     cat: 'Multi-product', date: '12 apr 2026',  base: 500,  mult: 1,   amount: 500,  kind: 'pos' },
    { id: 6, name: 'Boom-tier bereikt',               nameEn: 'Tree tier reached',            cat: 'Lifecycle',     date: '12 apr 2026',  base: 250,  mult: 1,   amount: 250,  kind: 'pos' },
    { id: 7, name: 'Slimme thermostaat gekoppeld',    nameEn: 'Smart thermostat connected',   cat: 'Energiegedrag', date: '28 mrt 2026',  base: 200,  mult: 1,   amount: 200,  kind: 'pos' },
    { id: 8, name: 'App geactiveerd',                 nameEn: 'App activated',                cat: 'App & Data',    date: '3 mrt 2026',   base: 150,  mult: 1,   amount: 150,  kind: 'pos' },
    { id: 9, name: 'Welkomstbonus',                   nameEn: 'Welcome bonus',                cat: 'Lifecycle',     date: '1 jan 2026',   base: 1000, mult: 1,   amount: 1000, kind: 'pos' },
  ],

  catalogue: [
    { cat: 'Contract & Lifecycle', catEn: 'Contract & Lifecycle', items: [
      { name: 'Welkomstbonus',              nameEn: 'Welcome bonus',             seeds: 1000, status: 'claimed' },
      { name: 'Boom-tier bereikt',          nameEn: 'Tree tier reached',         seeds: 250,  status: 'claimed' },
      { name: 'Contract verlengd (1 jaar)', nameEn: 'Contract renewed (1 year)', seeds: 400,  status: 'available' },
      { name: '5 jaar trouw lid',           nameEn: '5 years loyal member',      seeds: 1500, status: 'locked', need: 'Word lid voor 5 jaar — nog 4 jaar te gaan', needEn: 'Become a member for 5 years — 4 years to go' },
    ]},
    { cat: 'App & Data', catEn: 'App & Data', items: [
      { name: 'App geactiveerd',         nameEn: 'App activated',              seeds: 150, status: 'claimed' },
      { name: 'Maandelijkse meterstand', nameEn: 'Monthly meter reading',      seeds: 20,  status: 'available' },
      { name: 'Pushmeldingen aangezet',  nameEn: 'Push notifications enabled', seeds: 50,  status: 'available' },
    ]},
    { cat: 'Harvest Hours', catEn: 'Harvest Hours', items: [
      { name: 'Oogstdag — gratis stroom', nameEn: 'Harvest day — free electricity', seeds: 10,  status: 'claimed' },
      { name: 'Oogstdag — verschuiving',  nameEn: 'Harvest day — shift',            seeds: 20,  status: 'available' },
      { name: 'Volledig oogstseizoen',    nameEn: 'Full harvest season',            seeds: 300, status: 'locked', need: 'Verzamel oogstdagen het hele seizoen (apr–sep)', needEn: 'Collect harvest days throughout the season (Apr–Sep)' },
    ]},
    { cat: 'Energiegedrag', catEn: 'Energy behaviour', items: [
      { name: 'Slimme thermostaat gekoppeld', nameEn: 'Smart thermostat connected', seeds: 200, status: 'claimed' },
      { name: 'Verbruik onder gemiddelde',    nameEn: 'Consumption below average',  seeds: 120, status: 'available' },
      { name: 'Remote uitlezing uitgezet',    nameEn: 'Remote reading disabled',    seeds: -60, status: 'penalty', need: 'Boete: zet remote uitlezing weer aan om dit te voorkomen', needEn: 'Penalty: re-enable remote reading to avoid this' },
    ]},
    { cat: 'Multi-product', catEn: 'Multi-product', items: [
      { name: 'Tweede product: Internet',    nameEn: 'Second product: Internet', seeds: 500, status: 'claimed' },
      { name: 'Derde product: Verzekering',  nameEn: 'Third product: Insurance', seeds: 750, status: 'locked', need: 'Voeg een derde Budget Thuis-product toe', needEn: 'Add a third Budget Thuis product' },
      { name: 'Zonnepanelen geregistreerd',  nameEn: 'Solar panels registered',  seeds: 600, status: 'available' },
    ]},
  ],

  harvestSeason: { year: 2026, months: [3, 4, 5, 6, 7, 8], todayMonth: 5, todayDate: 3 },

  harvest: {
    optedIn: true,
    daysEarned: harvestDaysEarned,
    seasonSeeds: Math.round(harvestDaysEarned * SEEDS_PER_DAY * 1.5),
    seedsPerDay: SEEDS_PER_DAY,
    year: 2026,
    months: [3, 4, 5, 6, 7, 8],
    monthsData: harvestMonthsData,
  },

  remoteReadEnabled: false,

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

export function loadFromConfig(base: RRState): RRState {
  try {
    const saved = localStorage.getItem('rr-config');
    if (!saved) return base;

    const { catalogue: overrides } = JSON.parse(saved) as {
      catalogue: { name: string; status: CatalogueItemStatus }[];
    };

    if (!Array.isArray(overrides)) return base;

    const catalogue = base.catalogue.map(cat => ({
      ...cat,
      items: cat.items.map(item => {
        const override = overrides.find(o => o.name === item.name);
        return override ? { ...item, status: override.status } : item;
      }),
    }));

    // Collect active items in catalogue order (oldest → newest)
    const activeItems: { name: string; nameEn?: string; cat: string; seeds: number }[] = [];
    for (const cat of catalogue) {
      for (const item of cat.items) {
        if (item.status === 'claimed' || item.status === 'penalty') {
          activeItems.push({ name: item.name, nameEn: item.nameEn, cat: cat.cat, seeds: item.seeds });
        }
      }
    }

    // Rebuild ledger from active items; reverse so newest (last in catalogue) appears first
    let idCounter = 1;
    const ledger: LedgerEntry[] = activeItems
      .map((item, idx) => ({
        id: idCounter++,
        name: item.name,
        nameEn: item.nameEn,
        cat: item.cat,
        date: fakeDateFor(idx, activeItems.length),
        base: item.seeds,
        mult: 1,
        amount: item.seeds,
        kind: (item.seeds < 0 ? 'neg' : 'pos') as 'pos' | 'neg',
      }))
      .reverse();

    const balance = Math.min(
      base.cap,
      Math.max(0, activeItems.reduce((sum, i) => sum + i.seeds, 0))
    );

    const currentTier: TierKey =
      balance >= 6000 ? 'forest' :
      balance >= 2500 ? 'tree' : 'seed';

    const multiplier = currentTier === 'forest' ? 2 : currentTier === 'tree' ? 1.5 : 1;

    const nextTier =
      currentTier === 'forest' ? null :
      currentTier === 'tree'   ? { name: 'Bos',  nameEn: 'Forest', threshold: 6000 } :
                                  { name: 'Boom', nameEn: 'Tree',   threshold: 2500 };

    return { ...base, catalogue, balance, currentTier, multiplier, nextTier, ledger };
  } catch {
    return base;
  }
}

export const initialState: RRState = loadFromConfig(baseInitialState);
