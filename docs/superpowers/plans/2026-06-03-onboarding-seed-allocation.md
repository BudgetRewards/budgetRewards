# Onboarding Seed Allocation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** New users start at 0 seeds; their onboarding answers allocate configurable seed amounts that are added to state and shown on the home page.

**Architecture:** A code config object `ONBOARDING_REWARDS` plus a pure `computeOnboardingRewards(profile)` function produce ledger entries + a total. The base app state becomes a clean slate (0 seeds, empty ledger, unclaimed catalogue, reset harvest). A new `APPLY_ONBOARDING` reducer action updates live state when onboarding completes; `loadFromConfig` recomputes the same seeds from the saved `rr-profile` on boot so they survive refresh.

**Tech Stack:** Vite + React 19 + TypeScript, Vitest for tests, plain CSS. Store is `useReducer` + React context.

---

### Task 1: Add Profile type and APPLY_ONBOARDING action

**Files:**
- Modify: `src/app/store/types.ts:80-93`

- [ ] **Step 1: Add `Profile` type and convert `RRAction` to a union**

In `src/app/store/types.ts`, replace the existing `RRAction` definition (lines 90-93):

```ts
export type RRAction = {
  type: 'APPLY_TRIGGER';
  payload: TriggerPayload;
};
```

with:

```ts
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
```

Leave `TriggerPayload` and `Dispatch` unchanged.

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: `tsc -b` will now FAIL in `src/app/store/__tests__/reducer.test.ts` because it references `RRAction['payload']` (the union no longer has `payload` on every member). That failure is expected and is fixed in Task 3. Confirm the ONLY new errors are in `reducer.test.ts`; `types.ts` itself compiles. Do not commit yet.

- [ ] **Step 3: Commit**

```bash
git add src/app/store/types.ts
git commit -m "Add Profile type and APPLY_ONBOARDING action"
```

---

### Task 2: Shared date helper + onboarding rewards module

**Files:**
- Create: `src/app/store/format.ts`
- Create: `src/app/store/services/onboarding.ts`
- Test: `src/app/store/__tests__/services/onboarding.test.ts`

- [ ] **Step 1: Create the shared date helper**

Create `src/app/store/format.ts`:

```ts
export function formatDate(): string {
  return new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}
```

- [ ] **Step 2: Write the failing test for `computeOnboardingRewards`**

Create `src/app/store/__tests__/services/onboarding.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import { computeOnboardingRewards, ONBOARDING_REWARDS } from '../../services/onboarding';
import type { Profile } from '../../types';

const base: Profile = {
  solarPanels: false,
  homeBattery: false,
  householdSize: 1,
  customerYears: 0,
  products: [],
};

describe('computeOnboardingRewards', () => {
  test('household size always rewards (min 1 person)', () => {
    const { entries, total } = computeOnboardingRewards(base);
    expect(total).toBe(ONBOARDING_REWARDS.perHouseholdMember); // 50 × 1
    expect(entries).toHaveLength(1);
    expect(entries[0].cat).toBe('Onboarding');
    expect(entries[0].mult).toBe(1);
    expect(entries[0].kind).toBe('pos');
  });

  test('solar panels grant seeds only on Yes', () => {
    const yes = computeOnboardingRewards({ ...base, solarPanels: true });
    const no = computeOnboardingRewards({ ...base, solarPanels: false });
    expect(yes.total - no.total).toBe(ONBOARDING_REWARDS.solarPanels); // +600
  });

  test('home battery grants seeds only on Yes', () => {
    const yes = computeOnboardingRewards({ ...base, homeBattery: true });
    const no = computeOnboardingRewards({ ...base, homeBattery: false });
    expect(yes.total - no.total).toBe(ONBOARDING_REWARDS.homeBattery); // +400
  });

  test('products reward is per product', () => {
    const r = computeOnboardingRewards({ ...base, products: ['electricity', 'gas', 'tv'] });
    const productEntry = r.entries.find(e => e.name.startsWith('Producten'));
    expect(productEntry?.amount).toBe(ONBOARDING_REWARDS.perProduct * 3); // 750
    expect(productEntry?.nameEn).toBe('Products linked (×3)');
  });

  test('customer years reward is per year', () => {
    const r = computeOnboardingRewards({ ...base, customerYears: 5 });
    const yearEntry = r.entries.find(e => e.name.startsWith('Klantjaren'));
    expect(yearEntry?.amount).toBe(ONBOARDING_REWARDS.perCustomerYear * 5); // 500
  });

  test('zero-reward categories produce no ledger entry', () => {
    // base: no solar, no battery, 0 years, 0 products → only household entry
    const { entries } = computeOnboardingRewards(base);
    expect(entries.map(e => e.name)).toEqual(['Huishouden (×1)']);
  });

  test('full profile sums all categories and assigns sequential ids', () => {
    const r = computeOnboardingRewards({
      solarPanels: true, homeBattery: true, householdSize: 4, customerYears: 5,
      products: ['electricity', 'gas'],
    });
    // 600 + 400 + 250×2 + 100×5 + 50×4 = 600+400+500+500+200 = 2200
    expect(r.total).toBe(2200);
    expect(r.entries.map(e => e.id)).toEqual([1, 2, 3, 4, 5]);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/app/store/__tests__/services/onboarding.test.ts`
Expected: FAIL — cannot resolve `../../services/onboarding` (module not created yet).

- [ ] **Step 4: Implement `onboarding.ts`**

Create `src/app/store/services/onboarding.ts`:

```ts
import type { LedgerEntry, Profile } from '../types';
import { formatDate } from '../format';

export const ONBOARDING_REWARDS = {
  solarPanels: 600,        // granted only on Yes
  homeBattery: 400,        // granted only on Yes
  perProduct: 250,         // × products.length
  perCustomerYear: 100,    // × customerYears
  perHouseholdMember: 50,  // × householdSize
};

const CAT = 'Onboarding';

type Spec = { seeds: number; name: string; nameEn: string };

export function computeOnboardingRewards(
  profile: Profile,
): { entries: LedgerEntry[]; total: number } {
  const date = formatDate();
  const specs: Spec[] = [];

  if (profile.solarPanels) {
    specs.push({ seeds: ONBOARDING_REWARDS.solarPanels, name: 'Zonnepanelen geregistreerd', nameEn: 'Solar panels registered' });
  }
  if (profile.homeBattery) {
    specs.push({ seeds: ONBOARDING_REWARDS.homeBattery, name: 'Thuisbatterij geregistreerd', nameEn: 'Home battery registered' });
  }
  const productCount = profile.products.length;
  if (productCount > 0) {
    specs.push({ seeds: ONBOARDING_REWARDS.perProduct * productCount, name: `Producten gekoppeld (×${productCount})`, nameEn: `Products linked (×${productCount})` });
  }
  if (profile.customerYears > 0) {
    specs.push({ seeds: ONBOARDING_REWARDS.perCustomerYear * profile.customerYears, name: `Klantjaren (×${profile.customerYears})`, nameEn: `Customer years (×${profile.customerYears})` });
  }
  if (profile.householdSize > 0) {
    specs.push({ seeds: ONBOARDING_REWARDS.perHouseholdMember * profile.householdSize, name: `Huishouden (×${profile.householdSize})`, nameEn: `Household (×${profile.householdSize})` });
  }

  const entries: LedgerEntry[] = specs.map((s, i) => ({
    id: i + 1,
    name: s.name,
    nameEn: s.nameEn,
    cat: CAT,
    date,
    base: s.seeds,
    mult: 1,
    amount: s.seeds,
    kind: 'pos',
  }));

  const total = entries.reduce((sum, e) => sum + e.amount, 0);
  return { entries, total };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/app/store/__tests__/services/onboarding.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add src/app/store/format.ts src/app/store/services/onboarding.ts src/app/store/__tests__/services/onboarding.test.ts
git commit -m "Add onboarding rewards config and compute function"
```

---

### Task 3: Handle APPLY_ONBOARDING in the reducer

**Files:**
- Modify: `src/app/store/reducer.ts:93-101` (formatDate + reducer entry)
- Modify: `src/app/store/__tests__/reducer.test.ts:1-18` and add a describe block

- [ ] **Step 1: Write the failing test for `APPLY_ONBOARDING`**

In `src/app/store/__tests__/reducer.test.ts`, first fix the import + helper at the top. Replace lines 1-18:

```ts
import { describe, test, expect } from 'vitest';
import { reducer } from '../reducer';
import { initialState } from '../initialState';
import type { RRState, RRAction } from '../types';

const freshState: RRState = {
  ...initialState,
  balance: 0,
  currentTier: 'seed',
  multiplier: 1,
  nextTier: { name: 'Boom', nameEn: 'Tree', threshold: 2500 },
  ledger: [],
  remoteReadEnabled: true,
};

function apply(state: RRState, payload: Extract<RRAction, { type: 'APPLY_TRIGGER' }>['payload']): RRState {
  return reducer(state, { type: 'APPLY_TRIGGER', payload });
}
```

Then append a new describe block to the end of the file:

```ts
describe('APPLY_ONBOARDING', () => {
  test('sets balance and ledger from onboarding rewards', () => {
    const next = reducer(freshState, {
      type: 'APPLY_ONBOARDING',
      profile: { solarPanels: true, homeBattery: false, householdSize: 1, customerYears: 0, products: [] },
    });
    // 600 (solar) + 50 (1 person) = 650
    expect(next.balance).toBe(650);
    expect(next.ledger).toHaveLength(2);
    expect(next.currentTier).toBe('seed');
  });

  test('recomputes tier when onboarding total crosses 2500', () => {
    const next = reducer(freshState, {
      type: 'APPLY_ONBOARDING',
      profile: { solarPanels: true, homeBattery: true, householdSize: 6, customerYears: 20, products: ['a', 'b', 'c'] },
    });
    // 600 + 400 + 250×3 + 100×20 + 50×6 = 600+400+750+2000+300 = 4050
    expect(next.balance).toBe(4050);
    expect(next.currentTier).toBe('tree');
    expect(next.multiplier).toBe(1.5);
  });

  test('clamps onboarding total to cap (10000)', () => {
    const lowCap = { ...freshState, cap: 1000 };
    const next = reducer(lowCap, {
      type: 'APPLY_ONBOARDING',
      profile: { solarPanels: true, homeBattery: true, householdSize: 6, customerYears: 20, products: ['a', 'b', 'c'] },
    });
    expect(next.balance).toBe(1000);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/app/store/__tests__/reducer.test.ts`
Expected: FAIL — the `APPLY_ONBOARDING` branch is not implemented, so `next.balance` will be `0` (reducer currently returns state unchanged for non-`APPLY_TRIGGER` actions).

- [ ] **Step 3: Wire the shared `formatDate` into the reducer**

In `src/app/store/reducer.ts`, add this import after line 1 (`import type { ... } from './types';`):

```ts
import { computeOnboardingRewards } from './services/onboarding';
import { formatDate } from './format';
```

Then DELETE the local `formatDate` function (lines 93-95):

```ts
function formatDate(): string {
  return new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}
```

- [ ] **Step 4: Add the `APPLY_ONBOARDING` branch**

In `src/app/store/reducer.ts`, replace the opening of the `reducer` function. Change:

```ts
export function reducer(state: RRState, action: RRAction): RRState {
  if (action.type !== 'APPLY_TRIGGER') return state;
```

to:

```ts
export function reducer(state: RRState, action: RRAction): RRState {
  if (action.type === 'APPLY_ONBOARDING') {
    const { entries, total } = computeOnboardingRewards(action.profile);
    const balance = Math.min(state.cap, Math.max(0, total));
    const tier = evaluateTier(balance, state.currentTier);
    return {
      ...state,
      balance,
      ledger: entries,
      currentTier: tier,
      multiplier: TIER_MULTIPLIERS[tier],
      nextTier: nextTierFor(tier, state.tiers),
    };
  }

  if (action.type !== 'APPLY_TRIGGER') return state;
```

The rest of the function (which reads `action.payload`) is unchanged — after the two guards, TypeScript narrows `action` to the `APPLY_TRIGGER` member, so `action.payload` is valid.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/app/store/__tests__/reducer.test.ts`
Expected: PASS (all existing `APPLY_TRIGGER` tests + 3 new `APPLY_ONBOARDING` tests).

- [ ] **Step 6: Commit**

```bash
git add src/app/store/reducer.ts src/app/store/__tests__/reducer.test.ts
git commit -m "Handle APPLY_ONBOARDING in reducer"
```

---

### Task 4: Clean-slate base state + fold onboarding into loadFromConfig

**Files:**
- Modify: `src/app/store/initialState.ts` (whole file)
- Test: `src/app/store/__tests__/loadFromConfig.test.ts` (add a describe block)

- [ ] **Step 1: Write the failing test for profile-folding**

Append to `src/app/store/__tests__/loadFromConfig.test.ts` (it already imports `loadFromConfig`, `baseInitialState`, and has `beforeEach(() => localStorage.clear())`):

```ts
describe('loadFromConfig — onboarding profile', () => {
  test('folds onboarding seeds from rr-profile into balance and ledger', () => {
    localStorage.setItem('rr-profile', JSON.stringify({
      solarPanels: true, homeBattery: false, householdSize: 2, customerYears: 0, products: ['electricity'],
    }));
    const result = loadFromConfig(minimalState);
    // 600 (solar) + 250×1 (product) + 50×2 (household) = 950
    expect(result.balance).toBe(950);
    expect(result.ledger.length).toBe(3);
  });

  test('no rr-profile leaves base ledger and balance untouched', () => {
    const result = loadFromConfig(minimalState);
    expect(result.balance).toBe(0);
    expect(result.ledger).toEqual(minimalState.ledger);
  });

  test('malformed rr-profile is ignored', () => {
    localStorage.setItem('rr-profile', 'not-json');
    const result = loadFromConfig(minimalState);
    expect(result.balance).toBe(0);
  });
});
```

Note: `minimalState` (defined at the top of this file) already has `balance: 0`, `ledger: []` (inherited from `baseInitialState` after Task 4 Step 3), and `currentTier: 'seed'`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/app/store/__tests__/loadFromConfig.test.ts`
Expected: FAIL — `loadFromConfig` does not yet read `rr-profile`, so balance stays 0 in the first new test (expected 950).

- [ ] **Step 3: Rewrite `initialState.ts` as a clean slate that folds the profile**

Replace the ENTIRE contents of `src/app/store/initialState.ts` with:

```ts
import type { RRState, MonthData, HarvestCell, Profile, TierKey } from './types';
import { computeOnboardingRewards } from './services/onboarding';

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
      { name: 'Remote uitlezing uitgezet',    nameEn: 'Remote reading disabled',    seeds: -60, status: 'available', need: 'Boete: zet remote uitlezing weer aan om dit te voorkomen', needEn: 'Penalty: re-enable remote reading to avoid this' },
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
        catalogue: { name: string; status: import('./types').CatalogueItemStatus }[];
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
        catalogueBalance = catalogue.flatMap(c => c.items)
          .filter(i => i.status === 'claimed' || i.status === 'penalty')
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
  const ledger = [...onboarding.entries, ...base.ledger];

  return { ...base, catalogue, balance, currentTier, multiplier, nextTier, ledger };
}

export const initialState: RRState = loadFromConfig(baseInitialState);
```

- [ ] **Step 4: Run the loadFromConfig tests**

Run: `npx vitest run src/app/store/__tests__/loadFromConfig.test.ts`
Expected: PASS — all existing catalogue tests still pass (no `rr-profile` set in those), plus the 3 new profile tests.

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS. Watch for the `reducer.test.ts` `freshState` — it spreads `initialState` then overrides balance/ledger/tier, so the clean-slate base does not break it. Confirm green across all files.

- [ ] **Step 6: Commit**

```bash
git add src/app/store/initialState.ts src/app/store/__tests__/loadFromConfig.test.ts
git commit -m "Clean-slate base state and fold onboarding profile into loadFromConfig"
```

---

### Task 5: Wire the modal to dispatch onboarding rewards

**Files:**
- Modify: `src/app/store/RRContext.tsx:29-46`
- Modify: `src/app/OnboardingModal.jsx:1-3` and `:256-289`

- [ ] **Step 1: Expose `applyOnboarding` from the store context**

In `src/app/store/RRContext.tsx`, add `Profile` to the type import on line 2:

```ts
import type { RRState, Dispatch, Profile } from './types';
```

Then add one line to the object returned by `useTrigger` (after the `registerSolarPanels` line, inside the returned object):

```ts
    applyOnboarding:     (profile: Profile)               => dispatch({ type: 'APPLY_ONBOARDING', profile }),
```

- [ ] **Step 2: Import the trigger hook in the modal**

In `src/app/OnboardingModal.jsx`, add this import after line 3 (`import { BTLogo } ...`):

```jsx
import { useTrigger } from './store/RRContext.tsx'
```

- [ ] **Step 3: Call `applyOnboarding` on finish**

In `src/app/OnboardingModal.jsx`, update the `OnboardingModal` component. Change the hook line (line 257):

```jsx
  const { set, setUserName } = useLang()
```

to:

```jsx
  const { set, setUserName } = useLang()
  const { applyOnboarding } = useTrigger()
```

Then change the final-submit block in `handleNext` (lines 285-288):

```jsx
    // Final submit
    set(lang)
    setUserName(name.trim())
    localStorage.setItem('rr-profile', JSON.stringify({ ...profile, products }))
```

to:

```jsx
    // Final submit
    set(lang)
    setUserName(name.trim())
    const fullProfile = { ...profile, products }
    localStorage.setItem('rr-profile', JSON.stringify(fullProfile))
    applyOnboarding(fullProfile)
```

- [ ] **Step 4: Type-check and build**

Run: `npm run build`
Expected: PASS — `tsc -b` clean, Vite bundles. (`OnboardingModal.jsx` is JS, so the `applyOnboarding` arg is untyped there; the store side is typed.)

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: no NEW errors in the changed files (`RRContext.tsx`, `OnboardingModal.jsx`).

- [ ] **Step 6: Commit**

```bash
git add src/app/store/RRContext.tsx src/app/OnboardingModal.jsx
git commit -m "Dispatch onboarding rewards from the onboarding modal"
```

---

### Task 6: Full verification

**Files:**
- None (verification only)

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: PASS across all suites.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS (`tsc -b` + Vite bundle, no errors).

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open http://localhost:5173. In the browser devtools console run `localStorage.clear()` then reload so onboarding shows.
- Complete onboarding choosing e.g. solar = Yes, battery = No, 2 products, household 3, 4 customer years.
- Expected home balance = 600 + 250×2 + 50×3 + 100×4 = 600+500+150+400 = **1650**.
- History (ledger) shows one entry per rewarded category (solar, products, household, customer years) — no battery entry.
- Harvest chip shows **0** days.
- Reload the page (without clearing localStorage): balance stays **1650** (recomputed from `rr-profile`).

No commit needed — all work was committed in Tasks 1–5.

---

## Notes

- Reference spec: `docs/superpowers/specs/2026-06-03-onboarding-seed-allocation-design.md`.
- `formatDate` is extracted to `src/app/store/format.ts` to avoid a circular import between `reducer.ts` and `services/onboarding.ts`.
- Side effect (per spec): the clean-slate `baseInitialState` also resets the `/config` screen defaults to all-off, since `ConfigApp` reads `baseInitialState.catalogue`.
