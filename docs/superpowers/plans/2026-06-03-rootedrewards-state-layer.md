# RootedRewards State Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the browser-only in-memory state layer (Context + Reducer + Services) that the frontend team drives from UI interactions, shaped to match `docs/Spec File/data.jsx`.

**Architecture:** A single `RRContext` wraps the app with `useReducer`; all state lives in the `RR` object. Service functions compute seed payloads and dispatch a single `APPLY_TRIGGER` action; the reducer applies it, enforces the cap, upgrades tiers, and updates the catalogue and harvest calendar. Two hooks — `useRR()` and `useTrigger()` — are the frontend team's only interface.

**Tech Stack:** Vite 8, React 19, TypeScript 6, Vitest (unit tests), jsdom

---

## File Map

| File | Purpose |
|---|---|
| `src/store/types.ts` | All shared TypeScript types |
| `src/store/initialState.ts` | Typed initial state (ported from `data.jsx`) |
| `src/store/reducer.ts` | Pure reducer — APPLY_TRIGGER handler |
| `src/store/guards.ts` | `isAlreadyClaimed` helper |
| `src/store/RRContext.tsx` | Provider, `useRR()`, `useTrigger()` |
| `src/store/services/lifecycle.ts` | signupBonus, appActivated, renewContract |
| `src/store/services/appData.ts` | optInGratisStroom, optInRenewalComms, optInAnalytics, toggleRemoteRead |
| `src/store/services/harvestHours.ts` | harvestHoursEarned |
| `src/store/services/multiProduct.ts` | addProduct |
| `src/store/services/energyBehaviour.ts` | registerSolarPanels |
| `src/test-setup.ts` | Vitest global setup |
| `src/store/__tests__/reducer.test.ts` | Reducer unit tests |
| `src/store/__tests__/services/lifecycle.test.ts` | Lifecycle service tests |
| `src/store/__tests__/services/appData.test.ts` | App & data service tests |
| `src/store/__tests__/services/harvestHours.test.ts` | Harvest hours service tests |
| `src/store/__tests__/services/multiProduct.test.ts` | Multi-product service tests |
| `src/store/__tests__/services/energyBehaviour.test.ts` | Energy behaviour service tests |
| `vite.config.ts` | Add Vitest config |
| `src/App.tsx` | Wrap with RRProvider |

---

## Task 1: Set Up Vitest

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `src/test-setup.ts`

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Expected: packages added to `devDependencies`, no errors.

- [ ] **Step 2: Add test script to package.json**

Replace the `"scripts"` block in `package.json`:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest",
  "test:run": "vitest run"
},
```

- [ ] **Step 3: Add Vitest config to vite.config.ts**

Replace the entire file:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
  },
})
```

- [ ] **Step 4: Create test setup file**

Create `src/test-setup.ts`:

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 5: Verify setup with a smoke test**

Create `src/store/__tests__/smoke.test.ts`:

```ts
test('vitest is configured', () => {
  expect(1 + 1).toBe(2);
});
```

Run: `npx vitest run src/store/__tests__/smoke.test.ts`  
Expected: `1 passed`

- [ ] **Step 6: Delete smoke test and commit**

Delete `src/store/__tests__/smoke.test.ts`, then:

```bash
git add vite.config.ts package.json package-lock.json src/test-setup.ts
git commit -m "chore: add Vitest + jsdom testing infrastructure"
```

---

## Task 2: Define Types

**Files:**
- Create: `src/store/types.ts`

- [ ] **Step 1: Write the file**

Create `src/store/types.ts`:

```ts
export type TierKey = 'seed' | 'tree' | 'forest';
export type CatalogueItemStatus = 'claimed' | 'available' | 'locked' | 'penalty';

export type LedgerEntry = {
  id: number;
  name: string;
  cat: string;
  date: string;
  base: number;
  mult: number;
  amount: number;
  kind: 'pos' | 'neg';
};

export type CatalogueItem = {
  name: string;
  seeds: number;
  status: CatalogueItemStatus;
  need?: string;
};

export type CatalogueCategory = {
  cat: string;
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
  en: string;
  min: number;
  max: number | null;
  mult: string;
  routes: string[];
};

export type RRState = {
  user: { name: string; fullName: string };
  balance: number;
  cap: number;
  multiplier: number;
  period: { startLabel: string; endLabel: string; daysLeft: number };
  tiers: Tier[];
  currentTier: TierKey;
  nextTier: { name: string; threshold: number } | null;
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

export type RRAction = {
  type: 'APPLY_TRIGGER';
  payload: TriggerPayload;
};

export type Dispatch = (action: RRAction) => void;
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`  
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/store/types.ts
git commit -m "feat: add RRState and action types"
```

---

## Task 3: Build Initial State

**Files:**
- Create: `src/store/initialState.ts`

- [ ] **Step 1: Write the file**

Create `src/store/initialState.ts`:

```ts
import type { RRState, MonthData, HarvestCell } from './types';

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

export const initialState: RRState = {
  user: { name: 'Jan', fullName: 'Jan de Vries' },
  balance: 2600,
  cap: 10000,
  multiplier: 1.5,
  period: { startLabel: '1 jan 2026', endLabel: '31 dec 2026', daysLeft: 211 },

  tiers: [
    { id: 'seed',   emoji: '🌱', name: 'Zaad', en: 'Seed',   min: 0,    max: 2499, mult: '1×',   routes: ['Standaard startpunt voor elk lid'] },
    { id: 'tree',   emoji: '🌳', name: 'Boom', en: 'Tree',   min: 2500, max: 5999, mult: '1,5×', routes: ['2.500 seeds verzameld', 'of 12 maanden actief klant'] },
    { id: 'forest', emoji: '🌲', name: 'Bos',  en: 'Forest', min: 6000, max: null, mult: '2×',   routes: ['6.000 seeds verzameld', 'of 2+ producten + zonnepanelen', 'of 36 maanden actief klant'] },
  ],
  currentTier: 'tree',
  nextTier: { name: 'Bos', threshold: 6000 },

  ledger: [
    { id: 1, name: 'Harvest Hours — zaterdag',      cat: 'Harvest Hours', date: '31 mei 2026',  base: 10,   mult: 1.5, amount: 15,   kind: 'pos' },
    { id: 2, name: 'Remote uitlezing uitgezet',      cat: 'Energiegedrag', date: '24 mei 2026',  base: -60,  mult: 1.5, amount: -90,  kind: 'neg' },
    { id: 3, name: 'Harvest Hours — zondag',         cat: 'Harvest Hours', date: '18 mei 2026',  base: 10,   mult: 1.5, amount: 15,   kind: 'pos' },
    { id: 4, name: 'Maandelijkse meterstand',        cat: 'App & Data',    date: '1 mei 2026',   base: 20,   mult: 1.5, amount: 30,   kind: 'pos' },
    { id: 5, name: 'Tweede product: Internet',       cat: 'Multi-product', date: '12 apr 2026',  base: 500,  mult: 1,   amount: 500,  kind: 'pos' },
    { id: 6, name: 'Boom-tier bereikt',              cat: 'Lifecycle',     date: '12 apr 2026',  base: 250,  mult: 1,   amount: 250,  kind: 'pos' },
    { id: 7, name: 'Slimme thermostaat gekoppeld',   cat: 'Energiegedrag', date: '28 mrt 2026',  base: 200,  mult: 1,   amount: 200,  kind: 'pos' },
    { id: 8, name: 'App geactiveerd',               cat: 'App & Data',    date: '3 mrt 2026',   base: 150,  mult: 1,   amount: 150,  kind: 'pos' },
    { id: 9, name: 'Welkomstbonus',                 cat: 'Lifecycle',     date: '1 jan 2026',   base: 1000, mult: 1,   amount: 1000, kind: 'pos' },
  ],

  catalogue: [
    { cat: 'Contract & Lifecycle', items: [
      { name: 'Welkomstbonus',              seeds: 1000, status: 'claimed' },
      { name: 'Boom-tier bereikt',          seeds: 250,  status: 'claimed' },
      { name: 'Contract verlengd (1 jaar)', seeds: 400,  status: 'available' },
      { name: '5 jaar trouw lid',           seeds: 1500, status: 'locked', need: 'Word lid voor 5 jaar — nog 4 jaar te gaan' },
    ]},
    { cat: 'App & Data', items: [
      { name: 'App geactiveerd',         seeds: 150, status: 'claimed' },
      { name: 'Maandelijkse meterstand', seeds: 20,  status: 'available' },
      { name: 'Pushmeldingen aangezet',  seeds: 50,  status: 'available' },
    ]},
    { cat: 'Harvest Hours', items: [
      { name: 'Oogstdag — gratis stroom', seeds: 10,  status: 'claimed' },
      { name: 'Oogstdag — verschuiving',  seeds: 20,  status: 'available' },
      { name: 'Volledig oogstseizoen',    seeds: 300, status: 'locked', need: 'Verzamel oogstdagen het hele seizoen (apr–sep)' },
    ]},
    { cat: 'Energiegedrag', items: [
      { name: 'Slimme thermostaat gekoppeld', seeds: 200, status: 'claimed' },
      { name: 'Verbruik onder gemiddelde',    seeds: 120, status: 'available' },
      { name: 'Remote uitlezing uitgezet',    seeds: -60, status: 'penalty', need: 'Boete: zet remote uitlezing weer aan om dit te voorkomen' },
    ]},
    { cat: 'Multi-product', items: [
      { name: 'Tweede product: Internet',     seeds: 500, status: 'claimed' },
      { name: 'Derde product: Verzekering',   seeds: 750, status: 'locked', need: 'Voeg een derde Budget Thuis-product toe' },
      { name: 'Zonnepanelen geregistreerd',   seeds: 600, status: 'available' },
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
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`  
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/store/initialState.ts
git commit -m "feat: add typed initial RR state from data.jsx"
```

---

## Task 4: Build the Reducer

**Files:**
- Create: `src/store/reducer.ts`
- Create: `src/store/__tests__/reducer.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/store/__tests__/reducer.test.ts`:

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
  nextTier: { name: 'Boom', threshold: 2500 },
  ledger: [],
  remoteReadEnabled: true,
};

function apply(state: RRState, payload: RRAction['payload']): RRState {
  return reducer(state, { type: 'APPLY_TRIGGER', payload });
}

describe('APPLY_TRIGGER', () => {
  test('appends ledger entry and updates balance', () => {
    const next = apply(freshState, { name: 'Test', cat: 'App & Data', base: 100, kind: 'pos' });
    expect(next.balance).toBe(100);
    expect(next.ledger[0].name).toBe('Test');
    expect(next.ledger[0].amount).toBe(100);
    expect(next.ledger[0].mult).toBe(1);
  });

  test('applies tier multiplier to amount', () => {
    const treeState = { ...freshState, currentTier: 'tree' as const, multiplier: 1.5 };
    const next = apply(treeState, { name: 'Test', cat: 'App & Data', base: 100, kind: 'pos' });
    expect(next.ledger[0].amount).toBe(150);
    expect(next.balance).toBe(150);
  });

  test('clamps balance to cap (10000)', () => {
    const nearCap = { ...freshState, balance: 9900 };
    const next = apply(nearCap, { name: 'Test', cat: 'App & Data', base: 500, kind: 'pos' });
    expect(next.balance).toBe(10000);
  });

  test('clamps balance to 0 — never negative', () => {
    const next = apply(freshState, { name: 'Penalty', cat: 'App & Data', base: -500, kind: 'neg' });
    expect(next.balance).toBe(0);
  });

  test('upgrades tier from seed to tree when balance crosses 2500', () => {
    const near = { ...freshState, balance: 2400 };
    const next = apply(near, { name: 'Test', cat: 'App & Data', base: 200, kind: 'pos' });
    expect(next.currentTier).toBe('tree');
    expect(next.multiplier).toBe(1.5);
    expect(next.nextTier).toEqual({ name: 'Bos', threshold: 6000 });
  });

  test('upgrades tier from tree to forest when balance crosses 6000', () => {
    const near = { ...freshState, balance: 5900, currentTier: 'tree' as const, multiplier: 1.5 };
    const next = apply(near, { name: 'Test', cat: 'App & Data', base: 200, kind: 'pos' });
    expect(next.currentTier).toBe('forest');
    expect(next.multiplier).toBe(2);
    expect(next.nextTier).toBeNull();
  });

  test('tier never moves downward', () => {
    const forest = { ...freshState, balance: 6000, currentTier: 'forest' as const, multiplier: 2 };
    const next = apply(forest, { name: 'Penalty', cat: 'App & Data', base: -3000, kind: 'neg' });
    expect(next.currentTier).toBe('forest');
    expect(next.multiplier).toBe(2);
  });

  test('marks catalogue item as claimed when catalogueKey provided', () => {
    const next = apply(freshState, {
      name: 'App geactiveerd',
      cat: 'App & Data',
      base: 150,
      kind: 'pos',
      catalogueKey: 'App geactiveerd',
    });
    const item = next.catalogue
      .find(c => c.cat === 'App & Data')!
      .items.find(i => i.name === 'App geactiveerd');
    expect(item?.status).toBe('claimed');
  });

  test('marks harvest cell earned when harvestDate provided', () => {
    const next = apply(freshState, {
      name: 'Harvest Hours',
      cat: 'Harvest Hours',
      base: 10,
      kind: 'pos',
      harvestDate: '2026-08-02',
    });
    const aug = next.harvest.monthsData.find(mo => mo.m === 7)!;
    const cell = aug.cells.find(c => c && c.d === 2)!;
    expect(cell?.state).toBe('earned');
    expect(next.harvest.daysEarned).toBeGreaterThan(freshState.harvest.daysEarned);
  });

  test('sets remoteReadEnabled when setRemoteRead provided', () => {
    const next = apply(freshState, {
      name: 'Remote uitlezing uitgezet',
      cat: 'Energiegedrag',
      base: -60,
      kind: 'neg',
      setRemoteRead: false,
    });
    expect(next.remoteReadEnabled).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/store/__tests__/reducer.test.ts`  
Expected: FAIL — `reducer` not found.

- [ ] **Step 3: Implement the reducer**

Create `src/store/reducer.ts`:

```ts
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
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npx vitest run src/store/__tests__/reducer.test.ts`  
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/store/reducer.ts src/store/__tests__/reducer.test.ts
git commit -m "feat: add RR reducer with tier, cap, catalogue, and harvest logic"
```

---

## Task 5: Build the Guard Helper

**Files:**
- Create: `src/store/guards.ts`

- [ ] **Step 1: Write the file**

Create `src/store/guards.ts`:

```ts
import type { RRState } from './types';

export function isAlreadyClaimed(state: RRState, catalogueKey: string): boolean {
  return state.catalogue.some(cat =>
    cat.items.some(item => item.name === catalogueKey && item.status === 'claimed')
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`  
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/store/guards.ts
git commit -m "feat: add isAlreadyClaimed catalogue guard"
```

---

## Task 6: Build RRContext with Hooks

**Files:**
- Create: `src/store/RRContext.tsx`

- [ ] **Step 1: Write the file**

Create `src/store/RRContext.tsx`:

```tsx
import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { RRState, Dispatch } from './types';
import { initialState } from './initialState';
import { reducer } from './reducer';
import { signupBonus, appActivated, renewContract } from './services/lifecycle';
import { optInGratisStroom, optInRenewalComms, optInAnalytics, toggleRemoteRead } from './services/appData';
import { harvestHoursEarned } from './services/harvestHours';
import { addProduct } from './services/multiProduct';
import { registerSolarPanels } from './services/energyBehaviour';

type RRContextType = {
  state: RRState;
  dispatch: Dispatch;
};

const RRContext = createContext<RRContextType | null>(null);

export function RRProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <RRContext.Provider value={{ state, dispatch }}>{children}</RRContext.Provider>;
}

export function useRR(): RRState {
  const ctx = useContext(RRContext);
  if (!ctx) throw new Error('useRR must be used inside RRProvider');
  return ctx.state;
}

export function useTrigger() {
  const ctx = useContext(RRContext);
  if (!ctx) throw new Error('useTrigger must be used inside RRProvider');
  const { state, dispatch } = ctx;

  return {
    signupBonus:        ()                               => signupBonus(state, dispatch),
    appActivated:       ()                               => appActivated(state, dispatch),
    renewContract:      ()                               => renewContract(state, dispatch),
    optInGratisStroom:  ()                               => optInGratisStroom(state, dispatch),
    optInRenewalComms:  ()                               => optInRenewalComms(state, dispatch),
    optInAnalytics:     ()                               => optInAnalytics(state, dispatch),
    toggleRemoteRead:   (enabled: boolean)               => toggleRemoteRead(enabled, state, dispatch),
    harvestHoursEarned: (date: string, optedIn: boolean) => harvestHoursEarned(date, optedIn, state, dispatch),
    addProduct:         (productName: string)             => addProduct(productName, state, dispatch),
    registerSolarPanels: ()                              => registerSolarPanels(state, dispatch),
  };
}
```

> **Note:** This file imports services that don't exist yet — TypeScript will error until Tasks 7–11 are complete. Implement them in order and TypeScript will resolve.

- [ ] **Step 2: Commit (after Tasks 7–11 are done)**

```bash
git add src/store/RRContext.tsx
git commit -m "feat: add RRContext, RRProvider, useRR, useTrigger hooks"
```

---

## Task 7: Lifecycle Services

**Files:**
- Create: `src/store/services/lifecycle.ts`
- Create: `src/store/__tests__/services/lifecycle.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/store/__tests__/services/lifecycle.test.ts`:

```ts
import { describe, test, expect, vi } from 'vitest';
import { signupBonus, appActivated, renewContract } from '../../services/lifecycle';
import { initialState } from '../../initialState';
import type { RRState } from '../../types';

const cleanState: RRState = {
  ...initialState,
  balance: 0,
  ledger: [],
  catalogue: initialState.catalogue.map(cat => ({
    ...cat,
    items: cat.items.map(item => ({ ...item, status: 'available' as const })),
  })),
};

describe('signupBonus', () => {
  test('dispatches 1000 seeds when not yet claimed', () => {
    const dispatch = vi.fn();
    signupBonus(cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 1000, catalogueKey: 'Welkomstbonus' }),
    });
  });

  test('does not dispatch when already claimed', () => {
    const dispatch = vi.fn();
    signupBonus(initialState, dispatch); // initialState has Welkomstbonus claimed
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('appActivated', () => {
  test('dispatches 150 seeds when not yet claimed', () => {
    const dispatch = vi.fn();
    appActivated(cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 150, catalogueKey: 'App geactiveerd' }),
    });
  });

  test('does not dispatch when already claimed', () => {
    const dispatch = vi.fn();
    appActivated(initialState, dispatch);
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('renewContract', () => {
  test('dispatches 400 seeds when not yet claimed', () => {
    const dispatch = vi.fn();
    renewContract(cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 400, catalogueKey: 'Contract verlengd (1 jaar)' }),
    });
  });

  test('does not dispatch when already claimed', () => {
    const dispatch = vi.fn();
    const claimed = {
      ...cleanState,
      catalogue: cleanState.catalogue.map(cat =>
        cat.cat === 'Contract & Lifecycle'
          ? { ...cat, items: cat.items.map(i => i.name === 'Contract verlengd (1 jaar)' ? { ...i, status: 'claimed' as const } : i) }
          : cat
      ),
    };
    renewContract(claimed, dispatch);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/store/__tests__/services/lifecycle.test.ts`  
Expected: FAIL — module not found.

- [ ] **Step 3: Implement lifecycle services**

Create `src/store/services/lifecycle.ts`:

```ts
import type { RRState, Dispatch } from '../types';
import { isAlreadyClaimed } from '../guards';

export function signupBonus(state: RRState, dispatch: Dispatch): void {
  if (isAlreadyClaimed(state, 'Welkomstbonus')) return;
  dispatch({
    type: 'APPLY_TRIGGER',
    payload: { name: 'Welkomstbonus', cat: 'Lifecycle', base: 1000, kind: 'pos', catalogueKey: 'Welkomstbonus' },
  });
}

export function appActivated(state: RRState, dispatch: Dispatch): void {
  if (isAlreadyClaimed(state, 'App geactiveerd')) return;
  dispatch({
    type: 'APPLY_TRIGGER',
    payload: { name: 'App geactiveerd', cat: 'App & Data', base: 150, kind: 'pos', catalogueKey: 'App geactiveerd' },
  });
}

export function renewContract(state: RRState, dispatch: Dispatch): void {
  if (isAlreadyClaimed(state, 'Contract verlengd (1 jaar)')) return;
  dispatch({
    type: 'APPLY_TRIGGER',
    payload: { name: 'Contract verlengd (1 jaar)', cat: 'Contract & Lifecycle', base: 400, kind: 'pos', catalogueKey: 'Contract verlengd (1 jaar)' },
  });
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npx vitest run src/store/__tests__/services/lifecycle.test.ts`  
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/store/services/lifecycle.ts src/store/__tests__/services/lifecycle.test.ts
git commit -m "feat: add lifecycle services — signupBonus, appActivated, renewContract"
```

---

## Task 8: App & Data Services

**Files:**
- Create: `src/store/services/appData.ts`
- Create: `src/store/__tests__/services/appData.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/store/__tests__/services/appData.test.ts`:

```ts
import { describe, test, expect, vi } from 'vitest';
import { optInGratisStroom, optInRenewalComms, optInAnalytics, toggleRemoteRead } from '../../services/appData';
import { initialState } from '../../initialState';
import type { RRState } from '../../types';

const cleanState: RRState = {
  ...initialState,
  balance: 0,
  ledger: [],
  remoteReadEnabled: true,
  catalogue: initialState.catalogue.map(cat => ({
    ...cat,
    items: cat.items.map(item => ({ ...item, status: 'available' as const })),
  })),
};

describe('optInGratisStroom', () => {
  test('dispatches 150 seeds', () => {
    const dispatch = vi.fn();
    optInGratisStroom(cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 150, catalogueKey: 'Oogstdag — gratis stroom' }),
    });
  });

  test('does not dispatch when already claimed', () => {
    const dispatch = vi.fn();
    const claimed = {
      ...cleanState,
      catalogue: cleanState.catalogue.map(cat =>
        cat.cat === 'Harvest Hours'
          ? { ...cat, items: cat.items.map(i => i.name === 'Oogstdag — gratis stroom' ? { ...i, status: 'claimed' as const } : i) }
          : cat
      ),
    };
    optInGratisStroom(claimed, dispatch);
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('optInRenewalComms', () => {
  test('dispatches 200 seeds', () => {
    const dispatch = vi.fn();
    optInRenewalComms(cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 200, catalogueKey: 'Pushmeldingen aangezet' }),
    });
  });
});

describe('optInAnalytics', () => {
  test('dispatches 50 seeds', () => {
    const dispatch = vi.fn();
    optInAnalytics(cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 50 }),
    });
  });
});

describe('toggleRemoteRead', () => {
  test('applies -60 penalty when disabling', () => {
    const dispatch = vi.fn();
    toggleRemoteRead(false, cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: -60, kind: 'neg', setRemoteRead: false }),
    });
  });

  test('applies +60 restoration when enabling', () => {
    const dispatch = vi.fn();
    const disabled = { ...cleanState, remoteReadEnabled: false };
    toggleRemoteRead(true, disabled, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 60, kind: 'pos', setRemoteRead: true }),
    });
  });

  test('does not dispatch when already in requested state', () => {
    const dispatch = vi.fn();
    toggleRemoteRead(true, cleanState, dispatch); // already enabled
    expect(dispatch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/store/__tests__/services/appData.test.ts`  
Expected: FAIL — module not found.

- [ ] **Step 3: Implement appData services**

Create `src/store/services/appData.ts`:

```ts
import type { RRState, Dispatch } from '../types';
import { isAlreadyClaimed } from '../guards';

export function optInGratisStroom(state: RRState, dispatch: Dispatch): void {
  if (isAlreadyClaimed(state, 'Oogstdag — gratis stroom')) return;
  dispatch({
    type: 'APPLY_TRIGGER',
    payload: { name: 'Opt-in: gratis stroom', cat: 'App & Data', base: 150, kind: 'pos', catalogueKey: 'Oogstdag — gratis stroom' },
  });
}

export function optInRenewalComms(state: RRState, dispatch: Dispatch): void {
  if (isAlreadyClaimed(state, 'Pushmeldingen aangezet')) return;
  dispatch({
    type: 'APPLY_TRIGGER',
    payload: { name: 'Opt-in: verlengingscommunicatie', cat: 'App & Data', base: 200, kind: 'pos', catalogueKey: 'Pushmeldingen aangezet' },
  });
}

export function optInAnalytics(state: RRState, dispatch: Dispatch): void {
  if (isAlreadyClaimed(state, 'Maandelijkse meterstand')) return;
  dispatch({
    type: 'APPLY_TRIGGER',
    payload: { name: 'Opt-in: app analytics', cat: 'App & Data', base: 50, kind: 'pos', catalogueKey: 'Maandelijkse meterstand' },
  });
}

export function toggleRemoteRead(enabled: boolean, state: RRState, dispatch: Dispatch): void {
  if (enabled === state.remoteReadEnabled) return;
  if (!enabled) {
    dispatch({
      type: 'APPLY_TRIGGER',
      payload: { name: 'Remote uitlezing uitgezet', cat: 'Energiegedrag', base: -60, kind: 'neg', setRemoteRead: false },
    });
  } else {
    dispatch({
      type: 'APPLY_TRIGGER',
      payload: { name: 'Remote uitlezing hersteld', cat: 'Energiegedrag', base: 60, kind: 'pos', setRemoteRead: true },
    });
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npx vitest run src/store/__tests__/services/appData.test.ts`  
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/store/services/appData.ts src/store/__tests__/services/appData.test.ts
git commit -m "feat: add app & data services — opt-ins and remote read toggle"
```

---

## Task 9: Harvest Hours Service

**Files:**
- Create: `src/store/services/harvestHours.ts`
- Create: `src/store/__tests__/services/harvestHours.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/store/__tests__/services/harvestHours.test.ts`:

```ts
import { describe, test, expect, vi } from 'vitest';
import { harvestHoursEarned } from '../../services/harvestHours';
import { initialState } from '../../initialState';
import type { RRState } from '../../types';

const cleanState: RRState = { ...initialState };

describe('harvestHoursEarned', () => {
  test('dispatches +10 seeds when opted in to gratis stroom', () => {
    const dispatch = vi.fn();
    harvestHoursEarned('2026-08-02', true, cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 10, kind: 'pos', harvestDate: '2026-08-02' }),
    });
  });

  test('dispatches +20 seeds when not opted in', () => {
    const dispatch = vi.fn();
    harvestHoursEarned('2026-08-02', false, cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 20, kind: 'pos', harvestDate: '2026-08-02' }),
    });
  });

  test('does not dispatch if date cell is already earned', () => {
    const dispatch = vi.fn();
    const month = cleanState.harvest.monthsData.find(mo => mo.m === 3);
    const earnedDay = month?.cells.find(c => c && c.state === 'earned');
    if (!earnedDay) {
      expect(true).toBe(true); // skip if no earned days in initial state
      return;
    }
    const date = `2026-04-${String(earnedDay.d).padStart(2, '0')}`;
    harvestHoursEarned(date, true, cleanState, dispatch);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/store/__tests__/services/harvestHours.test.ts`  
Expected: FAIL — module not found.

- [ ] **Step 3: Implement harvest hours service**

Create `src/store/services/harvestHours.ts`:

```ts
import type { RRState, Dispatch } from '../types';

function isAlreadyEarned(state: RRState, isoDate: string): boolean {
  const date = new Date(isoDate);
  const m = date.getMonth();
  const d = date.getDate();
  const month = state.harvest.monthsData.find(mo => mo.m === m);
  if (!month) return false;
  const cell = month.cells.find(c => c && c.d === d);
  return cell?.state === 'earned';
}

export function harvestHoursEarned(
  isoDate: string,
  optedIn: boolean,
  state: RRState,
  dispatch: Dispatch,
): void {
  if (isAlreadyEarned(state, isoDate)) return;
  const base = optedIn ? 10 : 20;
  const label = optedIn ? 'Oogstdag — gratis stroom' : 'Oogstdag — verschuiving';
  dispatch({
    type: 'APPLY_TRIGGER',
    payload: { name: label, cat: 'Harvest Hours', base, kind: 'pos', harvestDate: isoDate },
  });
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npx vitest run src/store/__tests__/services/harvestHours.test.ts`  
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/store/services/harvestHours.ts src/store/__tests__/services/harvestHours.test.ts
git commit -m "feat: add harvestHoursEarned service"
```

---

## Task 10: Multi-Product Service

**Files:**
- Create: `src/store/services/multiProduct.ts`
- Create: `src/store/__tests__/services/multiProduct.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/store/__tests__/services/multiProduct.test.ts`:

```ts
import { describe, test, expect, vi } from 'vitest';
import { addProduct } from '../../services/multiProduct';
import { initialState } from '../../initialState';
import type { RRState } from '../../types';

const cleanState: RRState = {
  ...initialState,
  balance: 0,
  ledger: [],
  catalogue: initialState.catalogue.map(cat => ({
    ...cat,
    items: cat.items.map(item => ({ ...item, status: 'available' as const })),
  })),
};

describe('addProduct', () => {
  test('dispatches 500 seeds for second product (Internet)', () => {
    const dispatch = vi.fn();
    addProduct('Internet', cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 500, catalogueKey: 'Tweede product: Internet' }),
    });
  });

  test('dispatches 750 seeds for third product (Verzekering)', () => {
    const dispatch = vi.fn();
    const withInternet = {
      ...cleanState,
      catalogue: cleanState.catalogue.map(cat =>
        cat.cat === 'Multi-product'
          ? { ...cat, items: cat.items.map(i => i.name === 'Tweede product: Internet' ? { ...i, status: 'claimed' as const } : i) }
          : cat
      ),
    };
    addProduct('Verzekering', withInternet, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 750, catalogueKey: 'Derde product: Verzekering' }),
    });
  });

  test('does not dispatch if product already claimed', () => {
    const dispatch = vi.fn();
    addProduct('Internet', initialState, dispatch); // already claimed in initialState
    expect(dispatch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/store/__tests__/services/multiProduct.test.ts`  
Expected: FAIL — module not found.

- [ ] **Step 3: Implement multi-product service**

Create `src/store/services/multiProduct.ts`:

```ts
import type { RRState, Dispatch } from '../types';
import { isAlreadyClaimed } from '../guards';

const PRODUCT_CONFIG: Record<string, { catalogueKey: string; base: number }> = {
  Internet:     { catalogueKey: 'Tweede product: Internet',   base: 500 },
  Verzekering:  { catalogueKey: 'Derde product: Verzekering', base: 750 },
};

export function addProduct(productName: string, state: RRState, dispatch: Dispatch): void {
  const config = PRODUCT_CONFIG[productName];
  if (!config) return;
  if (isAlreadyClaimed(state, config.catalogueKey)) return;
  dispatch({
    type: 'APPLY_TRIGGER',
    payload: {
      name: config.catalogueKey,
      cat: 'Multi-product',
      base: config.base,
      kind: 'pos',
      catalogueKey: config.catalogueKey,
    },
  });
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npx vitest run src/store/__tests__/services/multiProduct.test.ts`  
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/store/services/multiProduct.ts src/store/__tests__/services/multiProduct.test.ts
git commit -m "feat: add addProduct service for cross-sell triggers"
```

---

## Task 11: Energy Behaviour Service

**Files:**
- Create: `src/store/services/energyBehaviour.ts`
- Create: `src/store/__tests__/services/energyBehaviour.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/store/__tests__/services/energyBehaviour.test.ts`:

```ts
import { describe, test, expect, vi } from 'vitest';
import { registerSolarPanels } from '../../services/energyBehaviour';
import { initialState } from '../../initialState';
import type { RRState } from '../../types';

const cleanState: RRState = {
  ...initialState,
  balance: 0,
  ledger: [],
  catalogue: initialState.catalogue.map(cat => ({
    ...cat,
    items: cat.items.map(item => ({ ...item, status: 'available' as const })),
  })),
};

describe('registerSolarPanels', () => {
  test('dispatches 600 seeds when not yet claimed', () => {
    const dispatch = vi.fn();
    registerSolarPanels(cleanState, dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'APPLY_TRIGGER',
      payload: expect.objectContaining({ base: 600, catalogueKey: 'Zonnepanelen geregistreerd' }),
    });
  });

  test('does not dispatch when already claimed', () => {
    const dispatch = vi.fn();
    const claimed = {
      ...cleanState,
      catalogue: cleanState.catalogue.map(cat =>
        cat.cat === 'Multi-product'
          ? { ...cat, items: cat.items.map(i => i.name === 'Zonnepanelen geregistreerd' ? { ...i, status: 'claimed' as const } : i) }
          : cat
      ),
    };
    registerSolarPanels(claimed, dispatch);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/store/__tests__/services/energyBehaviour.test.ts`  
Expected: FAIL — module not found.

- [ ] **Step 3: Implement energy behaviour service**

Create `src/store/services/energyBehaviour.ts`:

```ts
import type { RRState, Dispatch } from '../types';
import { isAlreadyClaimed } from '../guards';

export function registerSolarPanels(state: RRState, dispatch: Dispatch): void {
  if (isAlreadyClaimed(state, 'Zonnepanelen geregistreerd')) return;
  dispatch({
    type: 'APPLY_TRIGGER',
    payload: {
      name: 'Zonnepanelen geregistreerd',
      cat: 'Energiegedrag',
      base: 600,
      kind: 'pos',
      catalogueKey: 'Zonnepanelen geregistreerd',
    },
  });
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npx vitest run src/store/__tests__/services/energyBehaviour.test.ts`  
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/store/services/energyBehaviour.ts src/store/__tests__/services/energyBehaviour.test.ts
git commit -m "feat: add registerSolarPanels energy behaviour service"
```

---

## Task 12: Wire Provider into App and Full Test Run

**Files:**
- Modify: `src/App.tsx`
- Commit: `src/store/RRContext.tsx` (created in Task 6)

- [ ] **Step 1: Run all tests to confirm everything passes**

Run: `npx vitest run`  
Expected: all test files pass, no errors.

- [ ] **Step 2: Check App.tsx current content**

Read `src/App.tsx` to see current structure before editing.

- [ ] **Step 3: Wrap App with RRProvider**

Modify `src/main.tsx` — wrap the app root:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { RRProvider } from './store/RRContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RRProvider>
      <App />
    </RRProvider>
  </StrictMode>,
)
```

- [ ] **Step 4: Verify app starts**

Run: `npm run dev`  
Expected: Vite dev server starts, no TypeScript errors in console.

- [ ] **Step 5: Commit everything**

```bash
git add src/store/RRContext.tsx src/main.tsx
git commit -m "feat: wire RRProvider into app root — state layer complete"
```

---

## Handoff Notes for Frontend Team

After Task 12, the frontend team can use the state layer immediately:

```tsx
import { useRR, useTrigger } from './store/RRContext';

function BalanceCard() {
  const { balance, currentTier, multiplier } = useRR();
  const { renewContract, registerSolarPanels } = useTrigger();

  return (
    <div>
      <p>Balance: {balance} seeds</p>
      <p>Tier: {currentTier} ({multiplier}×)</p>
      <button onClick={renewContract}>Renew contract</button>
      <button onClick={registerSolarPanels}>Register solar panels</button>
    </div>
  );
}
```

All trigger guards are built-in — calling a trigger twice is safe.

---

*RootedRewards State Layer | Budget Thuis Hackathon 2026*
