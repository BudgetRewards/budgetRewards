# RootedRewards — Config Page Design

**Project:** Budget Thuis Hackathon 2026  
**Date:** 2026-06-03  
**Scope:** `/config` demo setup page + screen migration to reactive state  
**Stack:** Vite + React + TypeScript

---

## Overview

A full-screen admin panel at `http://localhost:5173/config` that lets the team configure which seed triggers are claimed before opening the app. State is persisted to `localStorage` so navigating to `/app` loads with the configured state. All existing app screens are migrated from the static `data.jsx` import to the reactive `useRR()` hook so they reflect the configured state automatically.

---

## Architecture

```
/config (browser tab)                /app (browser tab)
─────────────────────                ──────────────────
config/index.html                    app/index.html
  → src/config/main.tsx                → src/app/main.jsx
      → <ConfigApp>                        → <RRProvider>
          reads initialState.catalogue         loadFromConfig() reads
          renders grouped toggles              localStorage('rr-config')
          computes balance + tier live         applies overrides to initialState
          on toggle → writes localStorage      all screens get updated state
          "Open App →" → navigate /app
```

**Single source of truth:** `src/app/store/initialState.ts` — the config page imports the catalogue from `baseInitialState` directly. Seed values and categories are never duplicated.

---

## Files

| File | Action |
|---|---|
| `config/index.html` | Create — Vite entry point for `/config` route |
| `src/config/main.tsx` | Create — mounts `<ConfigApp>` |
| `src/config/ConfigApp.tsx` | Create — full config UI |
| `src/app/store/initialState.ts` | Modify — extract `baseInitialState`, add `loadFromConfig()` |
| `vite.config.ts` | Modify — add `/config` middleware + build entry |
| `src/app/screens/dashboard.jsx` | Modify — `import RR` → `useRR()` |
| `src/app/screens/ledger.jsx` | Modify — `import RR` → `useRR()` |
| `src/app/screens/catalogue.jsx` | Modify — `import RR` → `useRR()` |
| `src/app/screens/tiers.jsx` | Modify — `import RR` → `useRR()` |
| `src/app/screens/harvest.jsx` | Modify — `import RR` → `useRR()` |

---

## Config Page UI

Full-width desktop layout. No iOS phone frame.

```
┌──────────────────────────────────────────────────────────────┐
│ 🌱 RootedRewards Config              [Reset]  [Open App →]   │
├──────────────────────────────────────────────────────────────┤
│  Balance: 3,200   Tier: 🌳 Boom (1.5×)   Seeds to Bos: 2,800 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  CONTRACT & LIFECYCLE                                        │
│  ┌────────────────────────────────┬──────────┬────────────┐ │
│  │ Welkomstbonus                  │ +1,000 🟢 │  ● ON      │ │
│  │ Contract verlengd (1 jaar)     │   +400 🟢 │  ○ off     │ │
│  └────────────────────────────────┴──────────┴────────────┘ │
│                                                              │
│  APP & DATA                  (same pattern per category)    │
│  HARVEST HOURS                                               │
│  ENERGIEGEDRAG                                               │
│  MULTI-PRODUCT                                               │
└──────────────────────────────────────────────────────────────┘
```

**Header (sticky):**
- Live-computed balance, tier emoji + name, multiplier, seeds to next tier
- Updates on every toggle without navigating away

**Per item row:**
- Item name
- Seed value — green for positive (`+1,000`), red for negative (`−60`)
- Toggle switch — ON = `claimed` (or `penalty` for negative items), OFF = `available`

**Buttons:**
- **Reset** — clears `localStorage('rr-config')`, resets all toggles to `baseInitialState` defaults
- **Open App →** — writes final state to `localStorage`, navigates to `/app`

**Auto-save:** `localStorage` is written on every toggle. "Open App →" is just a navigation shortcut — state is already saved.

---

## localStorage Schema

Key: `rr-config`

```json
{
  "catalogue": [
    { "name": "Welkomstbonus", "status": "claimed" },
    { "name": "App geactiveerd", "status": "available" },
    { "name": "Remote uitlezing uitgezet", "status": "penalty" }
  ]
}
```

Only `name` and `status` are stored. Seed values are always read from `initialState.ts`.

---

## App Integration — `initialState.ts`

`baseInitialState` is extracted as a named const (the existing initial state, unchanged). A `loadFromConfig()` function wraps it:

```ts
function loadFromConfig(base: RRState): RRState {
  const saved = localStorage.getItem('rr-config');
  if (!saved) return base;

  const { catalogue: overrides } = JSON.parse(saved) as {
    catalogue: { name: string; status: CatalogueItemStatus }[];
  };

  const catalogue = base.catalogue.map(cat => ({
    ...cat,
    items: cat.items.map(item => {
      const override = overrides.find(o => o.name === item.name);
      return override ? { ...item, status: override.status } : item;
    }),
  }));

  // Balance = sum of claimed/penalty seeds, floored at 0
  const balance = Math.min(
    base.cap,
    Math.max(0,
      catalogue.flatMap(c => c.items)
        .filter(i => i.status === 'claimed' || i.status === 'penalty')
        .reduce((sum, i) => sum + i.seeds, 0)
    )
  );

  const currentTier: TierKey =
    balance >= 6000 ? 'forest' :
    balance >= 2500 ? 'tree' : 'seed';

  const multiplier =
    currentTier === 'forest' ? 2 :
    currentTier === 'tree' ? 1.5 : 1;

  const nextTier =
    currentTier === 'forest' ? null :
    currentTier === 'tree' ? { name: 'Bos', threshold: 6000 } :
    { name: 'Boom', threshold: 2500 };

  return { ...base, catalogue, balance, currentTier, multiplier, nextTier };
}

export const initialState: RRState = loadFromConfig(baseInitialState);
```

The `ledger` is not recomputed — it retains the mock history from `baseInitialState`. The balance is the authoritative value that drives tier and progress display.

---

## Screen Migration

Every screen replaces its static import with the hook. Pattern is identical across all 5 files:

```jsx
// Remove:
import RR from '../data.jsx'
// Add:
import { useRR } from '../store/RRContext.tsx'

// Inside component function, replace:
const R = RR;
// With:
const R = useRR();
```

No other changes to screen logic. Because `useRR()` returns the same shape as the `RR` object, all property accesses (`R.balance`, `R.tiers`, `R.ledger`, etc.) work unchanged.

---

## Vite Config Changes

Add `/config` to the middleware (same pattern as `/app`):

```ts
if (req.url === '/config' || req.url === '/config/') {
  const html = fs.readFileSync(resolve(__dirname, 'config/index.html'), 'utf-8')
  const transformed = await server.transformIndexHtml('/config/', html)
  res.setHeader('Content-Type', 'text/html')
  res.end(transformed)
  return
}
```

Add to build rollupOptions:
```ts
config: resolve(__dirname, 'config/index.html'),
```

---

## Out of Scope

- Harvest calendar cell toggles (harvest days earned are not part of the catalogue items)
- Persisting ledger entries to localStorage
- Config page authentication or access control
- Mobile layout for config page (desktop-only tool)

---

*RootedRewards Config Page | Budget Thuis Hackathon 2026*
