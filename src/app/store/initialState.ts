import type { RRState, MonthData, HarvestCell, CatalogueItemStatus, Profile } from './types';
import { computeOnboardingRewards } from './services/onboarding';
import { simulateDailyUsage } from './services/usageSimulator';
import {
  applyProfileToCatalogue,
  applyHarvestGate,
  claimedBalance,
  buildLedgerFromCatalogue,
  deriveTier,
  EMPTY_PROFILE,
} from './catalogueDerive';

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
      { name: 'Welkomstbonus',              nameEn: 'Welcome bonus',             seeds: 1000, status: 'claimed' },
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
      { name: 'Stroom',     nameEn: 'Electricity', seeds: 500, status: 'available' },
      { name: 'Gas',        nameEn: 'Gas',         seeds: 400, status: 'available' },
      { name: 'Internet',   nameEn: 'Internet',    seeds: 500, status: 'available' },
      { name: 'TV',         nameEn: 'TV',          seeds: 300, status: 'available' },
      { name: 'Mobiel',     nameEn: 'Mobile',      seeds: 300, status: 'available' },
      { name: 'Vaste lijn', nameEn: 'Landline',    seeds: 200, status: 'available' },
    ]},
    { cat: 'Stroom bonussen', catEn: 'Electricity benefits', parentProduct: 'Stroom', items: [
      { name: 'Remote uitlezing ingeschakeld',     nameEn: 'Remote reading enabled',           seeds: 10, status: 'available' },
      { name: 'Groene energie propositie actief',  nameEn: 'Green energy proposition active',  seeds: 10, status: 'available' },
      { name: 'Zonnepanelen geregistreerd',        nameEn: 'Solar panels registered',          seeds: 30, status: 'available' },
      { name: 'Slimme meter geïnstalleerd',        nameEn: 'Smart meter installed',            seeds: 40, status: 'available' },
      { name: 'Energietips gevolgd',               nameEn: 'Energy tips followed',             seeds: 20, status: 'available' },
      { name: 'Gebruik onder stroom gemiddelde',   nameEn: 'Usage below electricity average',  seeds: 30, status: 'available' },
    ]},
    { cat: 'Gas bonussen', catEn: 'Gas benefits', parentProduct: 'Gas', items: [
      { name: 'Gasverbruik onder gemiddelde', nameEn: 'Gas usage below average', seeds: 50, status: 'available' },
    ]},
    { cat: 'Internet bonussen', catEn: 'Internet benefits', parentProduct: 'Internet', items: [
      { name: 'Papierloze factuur',  nameEn: 'Paperless billing',   seeds: 15, status: 'available' },
      { name: 'Maand zonder storing', nameEn: 'Month without outage', seeds: 20, status: 'available' },
    ]},
    { cat: 'TV bonussen', catEn: 'TV benefits', parentProduct: 'TV', items: [
      { name: 'Streaming pakket actief',  nameEn: 'Streaming package active',   seeds: 30, status: 'available' },
      { name: 'Premium kanalen pakket',   nameEn: 'Premium channels package',   seeds: 50, status: 'available' },
    ]},
    { cat: 'Mobiel bonussen', catEn: 'Mobile benefits', parentProduct: 'Mobiel', items: [
      { name: 'Familielid aangemeld', nameEn: 'Family member signed up', seeds: 50, status: 'available' },
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

/** Apply a saved /config catalogue override (statuses) on top of a catalogue. */
function applyConfigOverrides(catalogue: RRState['catalogue']): RRState['catalogue'] {
  try {
    const saved = localStorage.getItem('rr-config');
    if (!saved) return catalogue;
    const parsed = JSON.parse(saved) as {
      catalogue: { name: string; status: CatalogueItemStatus }[];
    };
    if (!Array.isArray(parsed.catalogue)) return catalogue;
    const overrides = parsed.catalogue;
    return catalogue.map(cat => ({
      ...cat,
      items: cat.items.map(item => {
        const override = overrides.find(o => o.name === item.name);
        return override ? { ...item, status: override.status } : item;
      }),
    }));
  } catch {
    return catalogue;
  }
}

/**
 * Build the initial state from persisted demo inputs. The onboarding profile
 * (rr-profile) decides which products are owned (claimed) vs missed; a saved
 * /config override (rr-config) can then flip any item; finally the harvest gate
 * turns Harvest Hours into missed harvests whenever electricity isn't owned.
 * Balance counts claimed items only; the ledger mirrors claimed + missed items
 * plus the non-catalogue onboarding bonuses (battery, household, customer years).
 */
export function loadFromConfig(base: RRState): RRState {
  const profile = readProfile();

  // Always map a profile onto the catalogue — with no saved profile we use an
  // empty one, so unowned products start as missed harvests (Welcome stays claimed).
  let catalogue = applyProfileToCatalogue(base.catalogue, profile ?? EMPTY_PROFILE);
  catalogue = applyConfigOverrides(catalogue);
  catalogue = applyHarvestGate(catalogue);

  const onboarding = profile ? computeOnboardingRewards(profile) : { entries: [], total: 0 };

  const balance = Math.min(base.cap, Math.max(0, claimedBalance(catalogue) + onboarding.total));
  const { currentTier, multiplier, nextTier } = deriveTier(balance);

  // History mirrors the live state: claimed/missed catalogue items plus any
  // onboarding bonuses, newest-first. The static base ledger is replaced.
  const catalogueLedger = buildLedgerFromCatalogue(catalogue, onboarding.entries.length);
  const ledger = [...catalogueLedger, ...onboarding.entries];

  return { ...base, catalogue, balance, currentTier, multiplier, nextTier, ledger };
}

export const initialState: RRState = loadFromConfig(baseInitialState);
