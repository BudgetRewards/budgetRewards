import type { HourlyUsage } from './services/usageSimulator';

export type TierKey = 'seed' | 'tree' | 'forest';
export type CatalogueItemStatus = 'claimed' | 'available' | 'locked' | 'missed';

/** The most recent 24-hour usage simulation, held in app state. */
export type UsageRecord = {
  /** The day the simulation is for, as yyyy-mm-dd. */
  date: string;
  generatedAt: string;
  hasHomeBattery: boolean;
  hours: HourlyUsage[];
};

export type LedgerEntry = {
  id: number;
  name: string;
  nameEn?: string;
  cat: string;
  date: string;
  base: number;
  mult: number;
  amount: number;
  /** 'pos' = earned (counts toward balance); 'missed' = a harvest you missed out on (informational, never changes the balance). */
  kind: 'pos' | 'missed';
};

export type CatalogueItem = {
  name: string;
  nameEn?: string;
  seeds: number;
  status: CatalogueItemStatus;
  need?: string;
  needEn?: string;
};

export type CatalogueCategory = {
  cat: string;
  catEn?: string;
  items: CatalogueItem[];
  /** When set, this category is a product bonus sub-section gated on owning the named Multi-product item. */
  parentProduct?: string;
};

export type HarvestCell = {
  d: number;
  weekend: boolean;
  state: 'none' | 'earned' | 'missed' | 'upcoming';
  today: boolean;
} | null;

export type MonthData = {
  m: number;
  cells: HarvestCell[];
};

export type Tier = {
  id: TierKey;
  emoji: string;
  name: string;
  nameEn: string;
  en: string;
  min: number;
  max: number | null;
  mult: string;
  routes: string[];
  routesEn: string[];
};

export type RRState = {
  user: { name: string; fullName: string };
  balance: number;
  cap: number;
  multiplier: number;
  period: { startLabel: string; endLabel: string; daysLeft: number };
  tiers: Tier[];
  currentTier: TierKey;
  nextTier: { name: string; nameEn: string; threshold: number } | null;
  ledger: LedgerEntry[];
  catalogue: CatalogueCategory[];
  harvestSeason: { year: number; months: number[]; todayMonth: number; todayDate: number };
  harvest: {
    optedIn: boolean;
    daysEarned: number;
    seasonSeeds: number;
    seedsPerDay: number;
    year: number;
    months: number[];
    monthsData: MonthData[];
  };
  remoteReadEnabled: boolean;
  /** Every simulated day's usage, keyed by yyyy-mm-dd. */
  usages: Record<string, UsageRecord>;
  /** The day currently shown on the Usage screen. */
  currentUsageDate: string;
  /** Weekend ids (the Saturday's yyyy-mm-dd) already rewarded, to avoid double-awarding. */
  awardedWeekends: string[];
  /** Whether the history has new entries the customer hasn't viewed (drives the tab dot). */
  historyUnseen: boolean;
  /** The most recent weekend reward, shown as a toast until dismissed. */
  pendingReward: { amount: number; weekend: string; weekendEn: string } | null;
  /** Product ids (e.g. 'electricity', 'internet') whose contract has been renewed. */
  renewals: string[];
  /** The most recent renewal, shown as a popup until dismissed. */
  pendingRenewal: { product: string; name: string; nameEn: string; seeds: number } | null;
};

export type TriggerPayload = {
  name: string;
  nameEn?: string;
  cat: string;
  base: number;
  kind: 'pos' | 'missed';
  catalogueKey?: string;
  harvestDate?: string;
  setRemoteRead?: boolean;
};

export type Profile = {
  solarPanels: boolean;
  homeBattery: boolean;
  householdSize: number;
  customerYears: number;
  products: string[];
};

export type RRAction =
  | { type: 'APPLY_TRIGGER'; payload: TriggerPayload }
  | { type: 'APPLY_ONBOARDING'; profile: Profile }
  | { type: 'SET_USAGE'; payload: UsageRecord }
  | { type: 'SELECT_USAGE_DATE'; payload: { date: string } }
  | { type: 'MARK_HISTORY_SEEN' }
  | { type: 'DISMISS_REWARD' }
  /** Replace an existing ledger entry in-place and adjust the balance by the delta. */
  | { type: 'UPDATE_LEDGER_ENTRY'; id: number; base: number; amount: number }
  | { type: 'RENEW_PRODUCT'; product: string; name: string; nameEn: string; seeds: number }
  | { type: 'DISMISS_RENEWAL' };

export type Dispatch = (action: RRAction) => void;
