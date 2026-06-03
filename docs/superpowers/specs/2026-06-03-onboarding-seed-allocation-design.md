# Onboarding Seed Allocation — Design

**Date:** 2026-06-03
**Status:** Approved

## Goal

A new user starts at 0 seeds. The answers they give in the initial onboarding
popup allocate seeds, which are added to their state and shown as the seed count
on the home page. The seed amount granted per question is defined in a single
code config object, alongside the other triggers.

## Current behaviour

- `RRState.balance` is the seed count; the dashboard renders `R.balance`.
- The app boots at **2600 seeds** with a pre-filled ledger and pre-claimed
  catalogue items (showcase demo data). `initialState = loadFromConfig(baseInitialState)`.
- `OnboardingModal` collects `name`, `lang`, `products[]`, and a profile
  (`solarPanels`, `homeBattery`, `householdSize`, `customerYears`). On finish it
  **only** writes `rr-name` / `rr-lang` / `rr-profile` to localStorage — it never
  touches the store or balance.
- Triggers are service functions (`signupBonus`, etc.) in `src/app/store/services/`
  with hardcoded `base` amounts. The reducer's `APPLY_TRIGGER` multiplies `base`
  by the tier multiplier and appends a ledger entry.
- The store is in-memory (`useReducer`); balance is recomputed from saved data
  (`rr-config`) on every load, never persisted directly.
- The `/config` screen (`ConfigApp`) toggles catalogue items on/off; it reads
  defaults and seed amounts from `baseInitialState.catalogue`. It cannot edit
  seed amounts.

## Decisions

| Topic | Decision |
|-------|----------|
| Start state | Clean slate: balance 0, empty ledger, catalogue all unclaimed. Onboarding answers are the only seeds. One ledger entry per answered question that yields > 0. |
| Config shape | A code config object `ONBOARDING_REWARDS` (not a runtime UI). Lives with the triggers in `store/services`. |
| Solar panels | +600 only on **Yes** (No → 0) |
| Home battery | +400 only on **Yes** (No → 0) |
| Products | `perProduct` 250 × `products.length` |
| Customer years | `perCustomerYear` 100 × `customerYears` |
| Household size | `perHouseholdMember` 50 × `householdSize` |
| Name / language | 0 seeds (setup only) |
| Multiplier | Onboarding rewards are added **raw (×1)** so displayed seeds match config exactly. Tier still recalculates from the final balance. |
| Harvest demo data | Reset too: `daysEarned` 0, `seasonSeeds` 0, calendar rebuilt with no earned/missed weekends. |
| Persistence | Recompute onboarding seeds deterministically from saved `rr-profile` on boot (same pattern as the catalogue) so a refresh does not lose them. |
| Wiring approach | Recompute-on-load + a new `APPLY_ONBOARDING` reducer action for live update. |

## Architecture

### 1. New config + logic — `src/app/store/services/onboarding.ts`

```ts
export const ONBOARDING_REWARDS = {
  solarPanels: 600,        // if Yes
  homeBattery: 400,        // if Yes
  perProduct: 250,         // × products.length
  perCustomerYear: 100,    // × customerYears
  perHouseholdMember: 50,  // × householdSize
};
```

- `Profile` shape: `{ solarPanels: boolean; homeBattery: boolean; householdSize: number; customerYears: number; products: string[] }`.
- `computeOnboardingRewards(profile): { entries: LedgerEntry[]; total: number }`
  - Pure. Builds **one ledger entry per category that yields > 0 seeds**.
  - Each entry: `base` = raw seed value, `mult: 1`, `amount: base`, `kind: 'pos'`,
    `date` = today (via the existing `formatDate` helper), sequential `id`.
  - Categories and labels (nl / en):
    - Solar (if Yes): `Zonnepanelen geregistreerd` / `Solar panels registered`, +600
    - Battery (if Yes): `Thuisbatterij geregistreerd` / `Home battery registered`, +400
    - Products (if any): `Producten gekoppeld (×N)` / `Products linked (×N)`, +250×N
    - Customer years (if > 0): `Klantjaren (×N)` / `Customer years (×N)`, +100×N
    - Household: `Huishouden (×N)` / `Household (×N)`, +50×N
  - `total` = sum of entry amounts.
  - Reused by both the boot path (`loadFromConfig`) and the live dispatch
    (`APPLY_ONBOARDING`).

### 2. Clean-slate base — `src/app/store/initialState.ts`

- `baseInitialState` changes:
  - `balance: 0`
  - `ledger: []`
  - catalogue: every `claimed`/`penalty` item → `available`; `locked` items stay `locked`
  - `currentTier: 'seed'`, `multiplier: 1`, `nextTier` → Tree (threshold 2500)
  - `remoteReadEnabled: true` (penalty cleared)
  - harvest: `daysEarned: 0`, `seasonSeeds: 0`; `monthsData` rebuilt so past
    weekends are `none` (no earned/missed), future weekends remain `upcoming`
- `loadFromConfig(base)`:
  - Keep the existing catalogue-override + catalogue-derived balance logic.
  - Additionally read `rr-profile`; if present, run `computeOnboardingRewards`,
    add `total` to balance, prepend `entries` to the ledger.
  - Recompute `currentTier` / `multiplier` / `nextTier` from the final balance.

### 3. State + reducer — `types.ts`, `reducer.ts`

- `types.ts`: add `Profile` type; extend `RRAction` with
  `{ type: 'APPLY_ONBOARDING'; profile: Profile }`.
- `reducer.ts`: handle `APPLY_ONBOARDING` —
  `const { entries, total } = computeOnboardingRewards(profile)`, set
  `balance = Math.min(cap, total)`, `ledger = entries`, recompute tier /
  multiplier / nextTier using the existing `evaluateTier` / `nextTierFor` helpers.
  `APPLY_TRIGGER` behaviour is unchanged.

### 4. Wiring — `RRContext.tsx`, `OnboardingModal.jsx`

- `RRContext.tsx`: expose `applyOnboarding(profile)` from `useTrigger` (dispatches
  `APPLY_ONBOARDING`).
- `OnboardingModal.jsx` `handleNext` final submit: keep `set(lang)` and
  `setUserName(name.trim())`; save `rr-profile` (current shape:
  `{ ...profile, products }`); then call
  `applyOnboarding({ solarPanels, homeBattery, householdSize, customerYears, products })`.
  - The modal must obtain `applyOnboarding` from `useTrigger` (the store provider
    already wraps the app in `main.jsx`).

### 5. Tests

- `services/__tests__/onboarding.test.ts`: reward math — Yes/No booleans,
  multi-unit (products, years, household), zero-reward categories produce no
  ledger entry, `total` correctness.
- `store/__tests__/reducer.test.ts`: `APPLY_ONBOARDING` sets balance, ledger, and
  recomputes tier (e.g. a profile whose total ≥ 2500 yields Tree).
- `store/__tests__/loadFromConfig.test.ts`: a saved `rr-profile` folds onboarding
  seeds into the boot balance and ledger.

## Data flow

```
Onboarding finish
  → save rr-name / rr-lang / rr-profile
  → applyOnboarding(profile)  →  APPLY_ONBOARDING  →  balance = total, ledger = entries, tier recalculated
Dashboard renders R.balance (live)

Page reload
  → loadFromConfig(baseInitialState) reads rr-profile
  → computeOnboardingRewards → same balance + ledger reconstructed
```

## Side effects

- Changing `baseInitialState` to a clean slate also changes the `/config` screen
  defaults (all toggles start off, since `ConfigApp` reads `baseInitialState`).
  This is consistent with "start at 0"; toggling items on still works.

## Out of scope

- No runtime/UI editing of onboarding amounts (code config object only).
- No changes to the existing `APPLY_TRIGGER` triggers or their amounts.
- No new onboarding questions; the existing fields drive the rewards.

## Verification

- `npm test` — new and existing suites pass.
- `npm run build` — `tsc -b` + bundle, no errors.
- Manual: clear localStorage, open app → onboarding shows; complete it →
  dashboard balance equals the sum of the configured rewards for the chosen
  answers; ledger shows one entry per rewarded category; refresh → balance
  persists; harvest chip shows 0.
