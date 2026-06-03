export type TierKey = 'seed' | 'tree' | 'forest';
export type CatalogueItemStatus = 'claimed' | 'available' | 'locked' | 'penalty';

export type LedgerEntry = {
  id: number;
  name: string;
  nameEn?: string;
  cat: string;
  date: string;
  base: number;
  mult: number;
  amount: number;
  kind: 'pos' | 'neg';
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
};

export type TriggerPayload = {
  name: string;
  cat: string;
  base: number;
  kind: 'pos' | 'neg';
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
  | { type: 'APPLY_ONBOARDING'; profile: Profile };

export type Dispatch = (action: RRAction) => void;
