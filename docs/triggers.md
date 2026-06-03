# RootedRewards — Trigger Reference

All triggers live in `src/app/store/services/`. They are exposed to React components via the `useTrigger()` hook. Calling a trigger that has already been claimed is always safe — it silently does nothing.

---

## How to use

```jsx
import { useRR, useTrigger } from './store/RRContext.tsx'

function MyScreen() {
  const { balance, currentTier, ledger, catalogue, harvest } = useRR()
  const { renewContract, toggleRemoteRead, harvestHoursEarned } = useTrigger()

  return <button onClick={renewContract}>Renew contract</button>
}
```

`useRR()` — read-only access to the full RR state (balance, tier, ledger, catalogue, harvest calendar).  
`useTrigger()` — all trigger functions, pre-bound. Just call them.

---

## State that updates automatically after every trigger

| Field | What changes |
|---|---|
| `balance` | Recalculated: previous + (base × tier multiplier), clamped 0–10,000 |
| `ledger` | New entry prepended (newest first) |
| `currentTier` | Upgraded if balance crosses 2,500 or 6,000 (never goes down) |
| `multiplier` | Updated to match new tier (1, 1.5, or 2) |
| `nextTier` | Recalculated from new tier |
| `catalogue[*].status` | Item flipped to `'claimed'` (or `'penalty'`/`'available'` for remote read) |
| `harvest.daysEarned` | Recounted from calendar when a harvest day is earned |
| `harvest.seasonSeeds` | Recomputed from earned days × seedsPerDay × multiplier |
| `remoteReadEnabled` | Toggled by `toggleRemoteRead` |

---

## Tier Multipliers

| Tier | Dutch | Balance needed | Multiplier |
|---|---|---|---|
| 🌱 Zaad | Seed | 0 – 2,499 | **1×** |
| 🌳 Boom | Tree | 2,500 – 5,999 | **1.5×** |
| 🌲 Bos | Forest | 6,000+ | **2×** |

Seeds shown in the trigger table below are **base seeds before multiplier**. The actual seeds awarded = `base × currentMultiplier`.

---

## Trigger Catalogue

### Lifecycle (`src/app/store/services/lifecycle.ts`)

#### `signupBonus()`
- **Seeds:** +1,000
- **Guard:** Once-off — fires only if `'Welkomstbonus'` is not yet claimed
- **Catalogue item updated:** `Welkomstbonus` → `claimed`
- **Note:** Pre-seeded in `initialState` as already claimed — only useful for a fresh customer

#### `appActivated()`
- **Seeds:** +150
- **Guard:** Once-off — fires only if `'App geactiveerd'` is not yet claimed
- **Catalogue item updated:** `App geactiveerd` → `claimed`
- **Note:** Pre-seeded in `initialState` as already claimed

#### `renewContract()`
- **Seeds:** +400
- **Guard:** Once per period — fires only if `'Contract verlengd (1 jaar)'` is not yet claimed
- **Catalogue item updated:** `Contract verlengd (1 jaar)` → `claimed`

---

### App & Data (`src/app/store/services/appData.ts`)

#### `optInGratisStroom()`
- **Seeds:** +150
- **Guard:** Once-off — fires only if `'Oogstdag — gratis stroom'` is not yet claimed
- **Catalogue item updated:** `Oogstdag — gratis stroom` → `claimed`
- **Note:** Also sets `harvest.optedIn` context for future harvest days (+10 vs +20 seeds per day)

#### `optInRenewalComms()`
- **Seeds:** +200
- **Guard:** Once-off — fires only if `'Pushmeldingen aangezet'` is not yet claimed
- **Catalogue item updated:** `Pushmeldingen aangezet` → `claimed`

#### `optInAnalytics()`
- **Seeds:** +50
- **Guard:** Once-off — fires only if `'Maandelijkse meterstand'` is not yet claimed
- **Catalogue item updated:** `Maandelijkse meterstand` → `claimed`

#### `toggleRemoteRead(enabled: boolean)`
- **Seeds:** −60 base (penalty) when disabling / +60 base (restoration) when enabling
- **Guard:** No-op if already in the requested state
- **State updated:** `remoteReadEnabled` toggled
- **Catalogue item updated:** `Remote uitlezing uitgezet` → `'penalty'` (disabled) or `'available'` (enabled)
- **Example:**
  ```jsx
  toggleRemoteRead(false)  // customer disables remote read → penalty applied
  toggleRemoteRead(true)   // customer re-enables → restoration entry added
  ```

---

### Harvest Hours (`src/app/store/services/harvestHours.ts`)

#### `harvestHoursEarned(isoDate: string, optedIn: boolean)`
- **Seeds:** +10 (opted in to gratis stroom) or +20 (not opted in)
- **Guard:** No-op if the calendar cell for that date is already `'earned'`
- **State updated:** Harvest calendar cell marked `'earned'`, `daysEarned` and `seasonSeeds` recounted
- **Parameters:**
  - `isoDate` — date string in `'YYYY-MM-DD'` format, must be a weekend day in the harvest season (Apr–Sep)
  - `optedIn` — pass `state.harvest.optedIn` or your own flag; determines seeds per day
- **Example:**
  ```jsx
  const { harvest } = useRR()
  const { harvestHoursEarned } = useTrigger()

  // User clicks a weekend day on the harvest calendar
  harvestHoursEarned('2026-08-02', harvest.optedIn)
  ```
- **Note:** Higher reward for non-opted-in customers is intentional — they receive no tariff discount, so more seeds compensate

---

### Multi-Product (`src/app/store/services/multiProduct.ts`)

#### `addProduct(productName: string)`
- **Seeds:** +500 (Internet) or +750 (Verzekering)
- **Guard:** Once-off per product — no-op if that product's catalogue item is already `'claimed'`; no-op for unknown product names
- **Catalogue item updated:** matching item → `claimed`
- **Supported product names:**

| `productName` | Seeds | Catalogue item |
|---|---|---|
| `'Internet'` | +500 | `Tweede product: Internet` |
| `'Verzekering'` | +750 | `Derde product: Verzekering` |

- **Example:**
  ```jsx
  addProduct('Internet')     // customer adds internet product
  addProduct('Verzekering')  // customer adds insurance product
  ```

---

### Energy Behaviour (`src/app/store/services/energyBehaviour.ts`)

#### `registerSolarPanels()`
- **Seeds:** +600
- **Guard:** Once-off — fires only if `'Zonnepanelen geregistreerd'` is not yet claimed
- **Catalogue item updated:** `Zonnepanelen geregistreerd` → `claimed`

---

## All triggers at a glance

| Function | Base seeds | Guard | File |
|---|---|---|---|
| `signupBonus()` | +1,000 | once-off | lifecycle.ts |
| `appActivated()` | +150 | once-off | lifecycle.ts |
| `renewContract()` | +400 | once per period | lifecycle.ts |
| `optInGratisStroom()` | +150 | once-off | appData.ts |
| `optInRenewalComms()` | +200 | once-off | appData.ts |
| `optInAnalytics()` | +50 | once-off | appData.ts |
| `toggleRemoteRead(false)` | −60 | skips if already disabled | appData.ts |
| `toggleRemoteRead(true)` | +60 | skips if already enabled | appData.ts |
| `harvestHoursEarned(date, true)` | +10 | skips if day already earned | harvestHours.ts |
| `harvestHoursEarned(date, false)` | +20 | skips if day already earned | harvestHours.ts |
| `addProduct('Internet')` | +500 | once-off | multiProduct.ts |
| `addProduct('Verzekering')` | +750 | once-off | multiProduct.ts |
| `registerSolarPanels()` | +600 | once-off | energyBehaviour.ts |

**Remember:** actual seeds awarded = base × tier multiplier (1×, 1.5×, or 2×)

---

## Adding a new trigger

1. Add a service function to the appropriate file in `src/app/store/services/`
2. Export it and import it in `src/app/store/RRContext.tsx`
3. Add it to the `useTrigger()` return object
4. Add a catalogue item to `src/app/store/initialState.ts` if needed
5. Write a test in `src/app/store/__tests__/services/`

No changes needed to the reducer — new triggers dispatch the same `APPLY_TRIGGER` action.
