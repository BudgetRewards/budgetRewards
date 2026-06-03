# RootedRewards — State Layer Design

**Project:** Budget Thuis Hackathon 2026  
**Date:** 2026-06-03  
**Scope:** Browser-only in-memory state layer (no server, no database)  
**Stack:** Vite + React + TypeScript

---

## Overview

The frontend team builds UI components; the backend team owns the state layer. Two teams share one contract: the `RR` state shape (derived from `data.jsx`) and two hooks — `useRR()` to read state and `useTrigger()` to fire seed events.

State resets to `initialState` on page refresh. No persistence required for the hackathon demo.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React App                         │
│                                                     │
│  ┌─────────────┐    ┌──────────────────────────┐   │
│  │  RRProvider  │    │   Frontend Components    │   │
│  │  (Context)   │◄───│   useRR() / useTrigger() │   │
│  │  useReducer  │    └──────────────────────────┘   │
│  └──────┬───────┘                                   │
│         │ dispatch(APPLY_TRIGGER)                   │
│  ┌──────▼───────────────────────────────────────┐  │
│  │              Service Layer                    │  │
│  │                                               │  │
│  │  signupBonus()   harvestHoursEarned()         │  │
│  │  optInGratisStroom()  addProduct()            │  │
│  │  toggleRemoteRead()   renewContract()  ...    │  │
│  │                                               │  │
│  │  Each computes a LedgerEntry → dispatches     │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │              Reducer                          │  │
│  │                                               │  │
│  │  APPLY_TRIGGER:                               │  │
│  │    1. append ledger entry                     │  │
│  │    2. recompute balance (cap at 10,000)       │  │
│  │    3. check tier threshold → upgrade if met   │  │
│  │    4. recompute catalogue item statuses       │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Team ownership:**
- Backend team: `RRProvider`, reducer, service layer, `useRR`, `useTrigger`
- Frontend team: all React components — they never touch the reducer or services

---

## State Shape

The context state mirrors `data.jsx`'s `RR` object exactly. No renaming, no restructuring — the frontend team's components stay unchanged.

### Static (set once in initialState, never mutated)
```ts
user, cap, period, tiers, harvestSeason
```

### Reducer-owned (recomputed on every APPLY_TRIGGER)
```ts
balance       // sum of all ledger amounts, clamped 0–10,000
multiplier    // derived from currentTier (1 | 1.5 | 2)
currentTier   // 'seed' | 'tree' | 'forest' — only moves upward
nextTier      // recomputed after tier check
ledger        // new entry appended (newest first)
catalogue     // item status flipped 'available' → 'claimed' or 'penalty'
harvest       // daysEarned + seasonSeeds recounted from monthsData
```

---

## The Action

A single action type keeps the reducer simple:

```ts
type ApplyTriggerAction = {
  type: 'APPLY_TRIGGER';
  payload: {
    name: string;          // display name shown in ledger
    cat: string;           // catalogue category
    base: number;          // base seeds before multiplier (negative = penalty)
    kind: 'pos' | 'neg';
    catalogueKey?: string; // optional — catalogue item to flip to 'claimed'
    harvestDate?: string;  // optional — ISO date to mark harvest cell 'earned'
  };
};
```

---

## Reducer Steps (APPLY_TRIGGER)

Executed in order on every trigger dispatch:

1. Compute `mult` from current tier (`seed`→1, `tree`→1.5, `forest`→2)
2. Compute `amount = Math.round(base × mult)`
3. Build ledger entry: `{ id, name, cat, date: today, base, mult, amount, kind }`
4. Prepend to `ledger` (newest first)
5. Recompute `balance = clamp(previous + amount, 0, 10000)`
6. Check tier thresholds — upgrade `currentTier` upward only:
   - `balance >= 6000` → `'forest'` (2×)
   - `balance >= 2500` → `'tree'` (1.5×)
7. Recompute `multiplier` and `nextTier` from new tier
8. If `catalogueKey` present → set that catalogue item's `status` to `'claimed'`
9. If `harvestDate` present → mark calendar cell `'earned'`, recount `daysEarned` and `seasonSeeds`

---

## File Structure

```
src/
  store/
    RRContext.tsx          ← RRProvider, useRR(), useTrigger()
    reducer.ts             ← reducer + tier threshold logic
    initialState.ts        ← RR object from data.jsx typed as RRState
    services/
      lifecycle.ts         ← signupBonus, appActivated, renewContract
      appData.ts           ← optInGratisStroom, optInRenewalComms, optInAnalytics, toggleRemoteRead
      harvestHours.ts      ← harvestHoursEarned(date, optedIn)
      multiProduct.ts      ← addProduct(productName)
      energyBehaviour.ts   ← registerSolarPanels
```

---

## Service Contract

All services share the same signature:

```ts
function serviceName(state: RRState, dispatch: Dispatch): void
```

Guard check (idempotency) is inside each service — once-off triggers check `isAlreadyClaimed(state, catalogueKey)` and return early if true.

The `useTrigger()` hook pre-binds `state` and `dispatch`, so components call:

```ts
const { optInGratisStroom, harvestHoursEarned, addProduct } = useTrigger();
optInGratisStroom();                        // no arguments needed
harvestHoursEarned('2026-06-07', true);     // date + whether opted in to gratis stroom
addProduct('Internet');
```

---

## Triggers to Implement (v1)

| Service | File | Base Seeds | Guard |
|---|---|---|---|
| `signupBonus` | lifecycle.ts | +1000 | once-off (pre-seeded in initial state) |
| `appActivated` | lifecycle.ts | +150 | once-off |
| `renewContract` | lifecycle.ts | +200 | once per period |
| `optInGratisStroom` | appData.ts | +150 | once-off |
| `optInRenewalComms` | appData.ts | +200 | once-off |
| `optInAnalytics` | appData.ts | +150 | once-off |
| `toggleRemoteRead(false)` | appData.ts | −90 | reversible — penalty flag |
| `toggleRemoteRead(true)` | appData.ts | removes penalty | reversible |
| `harvestHoursEarned(date, true)` | harvestHours.ts | +10 | per calendar day |
| `harvestHoursEarned(date, false)` | harvestHours.ts | +20 | per calendar day |
| `addProduct(name)` | multiProduct.ts | +250 / +350 | once-off per product |
| `registerSolarPanels` | energyBehaviour.ts | +300 | once-off |

**Seed values are multiplied by the current tier multiplier at dispatch time.**  
`harvestHoursEarned` uses +10 when `optedIn = true` (gratis stroom rate) and +20 when `optedIn = false` (shift incentive rate).

---

## Out of Scope (v1)

- Server, database, or API calls of any kind
- Session persistence across page refreshes
- Real-time push from an external system
- Admin trigger management UI
- Penalty reversal for `toggleRemoteRead` (tracked as a flag, not a ledger reversal entry, for demo simplicity)
- Harvest Hours season-end bonus (`Volledig oogstseizoen`)

---

*RootedRewards State Layer | Budget Thuis Hackathon 2026*
