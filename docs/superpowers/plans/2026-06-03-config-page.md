# Config Page + Screen Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/config` demo setup page that lets the team toggle which seed triggers are claimed, persists to localStorage, and drives the app's initial state — plus migrate all existing screens to use `useRR()` instead of the static `data.jsx` import.

**Architecture:** `/config` is a separate Vite entry point (React, no iOS frame) that reads `baseInitialState.catalogue` as its source of truth, writes overrides to `localStorage('rr-config')`, and navigates to `/app` when done. `initialState.ts` gains a `loadFromConfig()` wrapper that reads localStorage on app boot and applies catalogue status overrides before the `RRProvider` mounts. All five screen files swap their static `import RR from '../data.jsx'` for `useRR()` so they re-render reactively.

**Tech Stack:** Vite 8, React 19, TypeScript 6, Vitest (unit tests), jsdom

> **Commit style:** Do NOT commit after each task. Make one final commit at the end of Task 6 with all changes.

---

## File Map

| File | Action |
|---|---|
| `src/app/store/initialState.ts` | Modify — rename to `baseInitialState`, add `loadFromConfig()`, export both |
| `src/app/store/__tests__/loadFromConfig.test.ts` | Create — unit tests for `loadFromConfig` |
| `vite.config.ts` | Modify — add `/config` middleware + build entry |
| `config/index.html` | Create — Vite HTML entry for `/config` route |
| `src/config/main.tsx` | Create — mounts `<ConfigApp>` |
| `src/config/ConfigApp.tsx` | Create — full config UI |
| `src/app/screens/dashboard.jsx` | Modify — swap static import for `useRR()` |
| `src/app/screens/ledger.jsx` | Modify — swap static import for `useRR()` |
| `src/app/screens/catalogue.jsx` | Modify — swap static import for `useRR()` |
| `src/app/screens/tiers.jsx` | Modify — swap static import for `useRR()` |
| `src/app/screens/harvest.jsx` | Modify — swap static import for `useRR()` |

---

## Task 1: Update initialState — extract baseInitialState + loadFromConfig

**Files:**
- Modify: `src/app/store/initialState.ts`
- Create: `src/app/store/__tests__/loadFromConfig.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/app/store/__tests__/loadFromConfig.test.ts`:

```ts
import { describe, test, expect, beforeEach } from 'vitest';
import { loadFromConfig } from '../initialState';
import { baseInitialState } from '../initialState';
import type { RRState } from '../types';

// Minimal predictable state — avoids depending on the full mock's pre-claimed items
const minimalState: RRState = {
  ...baseInitialState,
  balance: 0,
  currentTier: 'seed',
  multiplier: 1,
  nextTier: { name: 'Boom', threshold: 2500 },
  catalogue: [
    { cat: 'Test', items: [
      { name: 'Item A', seeds: 1000, status: 'available' },
      { name: 'Item B', seeds: 200,  status: 'available' },
      { name: 'Item C', seeds: -60,  status: 'available' },
    ]},
  ],
};

beforeEach(() => localStorage.clear());

describe('loadFromConfig', () => {
  test('returns base state unchanged when localStorage is empty', () => {
    const result = loadFromConfig(minimalState);
    expect(result).toEqual(minimalState);
  });

  test('applies catalogue status overrides', () => {
    localStorage.setItem('rr-config', JSON.stringify({
      catalogue: [{ name: 'Item A', status: 'claimed' }],
    }));
    const result = loadFromConfig(minimalState);
    const item = result.catalogue[0].items.find(i => i.name === 'Item A');
    expect(item?.status).toBe('claimed');
  });

  test('does not affect items not in the override list', () => {
    localStorage.setItem('rr-config', JSON.stringify({
      catalogue: [{ name: 'Item A', status: 'claimed' }],
    }));
    const result = loadFromConfig(minimalState);
    const itemB = result.catalogue[0].items.find(i => i.name === 'Item B');
    expect(itemB?.status).toBe('available');
  });

  test('recomputes balance from claimed items', () => {
    localStorage.setItem('rr-config', JSON.stringify({
      catalogue: [
        { name: 'Item A', status: 'claimed' },
        { name: 'Item B', status: 'claimed' },
      ],
    }));
    const result = loadFromConfig(minimalState);
    expect(result.balance).toBe(1200);
  });

  test('includes penalty items as negative in balance', () => {
    localStorage.setItem('rr-config', JSON.stringify({
      catalogue: [
        { name: 'Item A', status: 'claimed' },
        { name: 'Item C', status: 'penalty' },
      ],
    }));
    const result = loadFromConfig(minimalState);
    expect(result.balance).toBe(940); // 1000 - 60
  });

  test('clamps balance to 0 — never negative', () => {
    localStorage.setItem('rr-config', JSON.stringify({
      catalogue: [{ name: 'Item C', status: 'penalty' }],
    }));
    const result = loadFromConfig(minimalState);
    expect(result.balance).toBe(0);
  });

  test('sets tree tier when balance >= 2500', () => {
    const bigState: RRState = {
      ...minimalState,
      catalogue: [{ cat: 'Test', items: [{ name: 'Big', seeds: 2500, status: 'available' }] }],
    };
    localStorage.setItem('rr-config', JSON.stringify({
      catalogue: [{ name: 'Big', status: 'claimed' }],
    }));
    const result = loadFromConfig(bigState);
    expect(result.currentTier).toBe('tree');
    expect(result.multiplier).toBe(1.5);
    expect(result.nextTier).toEqual({ name: 'Bos', threshold: 6000 });
  });

  test('sets forest tier when balance >= 6000 and nextTier is null', () => {
    const bigState: RRState = {
      ...minimalState,
      catalogue: [{ cat: 'Test', items: [{ name: 'Huge', seeds: 6000, status: 'available' }] }],
    };
    localStorage.setItem('rr-config', JSON.stringify({
      catalogue: [{ name: 'Huge', status: 'claimed' }],
    }));
    const result = loadFromConfig(bigState);
    expect(result.currentTier).toBe('forest');
    expect(result.multiplier).toBe(2);
    expect(result.nextTier).toBeNull();
  });

  test('ignores unknown item names in overrides', () => {
    localStorage.setItem('rr-config', JSON.stringify({
      catalogue: [{ name: 'Does Not Exist', status: 'claimed' }],
    }));
    const result = loadFromConfig(minimalState);
    expect(result.balance).toBe(0);
  });

  test('returns base state unchanged on malformed localStorage JSON', () => {
    localStorage.setItem('rr-config', 'not-valid-json');
    const result = loadFromConfig(minimalState);
    expect(result).toEqual(minimalState);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/app/store/__tests__/loadFromConfig.test.ts
```
Expected: FAIL — `loadFromConfig` and `baseInitialState` not exported.

- [ ] **Step 3: Update initialState.ts**

In `src/app/store/initialState.ts`, make three changes:

**Change 1** — rename the existing `export const initialState` to `export const baseInitialState` (keep all content identical, just rename):
```ts
// Change this line:
export const initialState: RRState = {
// To:
export const baseInitialState: RRState = {
```

**Change 2** — add `loadFromConfig` function after the `baseInitialState` declaration (before any other exports):
```ts
export function loadFromConfig(base: RRState): RRState {
  try {
    const saved = localStorage.getItem('rr-config');
    if (!saved) return base;

    const { catalogue: overrides } = JSON.parse(saved) as {
      catalogue: { name: string; status: import('./types').CatalogueItemStatus }[];
    };

    const catalogue = base.catalogue.map(cat => ({
      ...cat,
      items: cat.items.map(item => {
        const override = overrides.find(o => o.name === item.name);
        return override ? { ...item, status: override.status } : item;
      }),
    }));

    const balance = Math.min(
      base.cap,
      Math.max(0,
        catalogue.flatMap(c => c.items)
          .filter(i => i.status === 'claimed' || i.status === 'penalty')
          .reduce((sum, i) => sum + i.seeds, 0)
      )
    );

    const currentTier: import('./types').TierKey =
      balance >= 6000 ? 'forest' :
      balance >= 2500 ? 'tree' : 'seed';

    const multiplier = currentTier === 'forest' ? 2 : currentTier === 'tree' ? 1.5 : 1;

    const nextTier =
      currentTier === 'forest' ? null :
      currentTier === 'tree'   ? { name: 'Bos',  threshold: 6000 } :
                                  { name: 'Boom', threshold: 2500 };

    return { ...base, catalogue, balance, currentTier, multiplier, nextTier };
  } catch {
    return base;
  }
}
```

**Change 3** — add this line at the bottom of the file:
```ts
export const initialState: RRState = loadFromConfig(baseInitialState);
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/app/store/__tests__/loadFromConfig.test.ts
```
Expected: all 10 tests pass.

- [ ] **Step 5: Run full suite to confirm existing tests still pass**

```bash
npx vitest run
```
Expected: all test files pass (existing service tests import `initialState` which is still exported unchanged).

---

## Task 2: Update Vite Config

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Add /config middleware and build entry**

In `vite.config.ts`, extend the `configureServer` middleware to also handle `/config`, and add `config` to the build rollup inputs:

Replace the full file with:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'app-page',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/app' || req.url === '/app/') {
            const html = fs.readFileSync(resolve(__dirname, 'app/index.html'), 'utf-8')
            const transformed = await server.transformIndexHtml('/app/', html)
            res.setHeader('Content-Type', 'text/html')
            res.end(transformed)
            return
          }
          if (req.url === '/config' || req.url === '/config/') {
            const html = fs.readFileSync(resolve(__dirname, 'config/index.html'), 'utf-8')
            const transformed = await server.transformIndexHtml('/config/', html)
            res.setHeader('Content-Type', 'text/html')
            res.end(transformed)
            return
          }
          next()
        })
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main:   resolve(__dirname, 'index.html'),
        app:    resolve(__dirname, 'app/index.html'),
        config: resolve(__dirname, 'config/index.html'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/app/test-setup.ts',
  },
})
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors (config/index.html doesn't exist yet — that's fine, tsc doesn't check HTML).

---

## Task 3: Create Config Entry Points

**Files:**
- Create: `config/index.html`
- Create: `src/config/main.tsx`

- [ ] **Step 1: Create config/index.html**

Create `config/index.html` at the project root (same level as `app/index.html`):

```html
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>RootedRewards · Config</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="../src/config/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 2: Create src/config/main.tsx**

Create `src/config/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigApp } from './ConfigApp';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ConfigApp />
);
```

- [ ] **Step 3: Verify dev server serves /config**

Start the dev server:
```bash
npm run dev
```
Open `http://localhost:5173/config` in the browser.
Expected: blank page with no 404 (ConfigApp doesn't exist yet — that's fine, Vite will show a module error, not a 404).

Stop the dev server.

---

## Task 4: Create ConfigApp

**Files:**
- Create: `src/config/ConfigApp.tsx`
- Create: `src/config/__tests__/ConfigApp.test.tsx`

- [ ] **Step 1: Write the failing smoke tests**

Create `src/config/__tests__/ConfigApp.test.tsx`:

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import { ConfigApp } from '../ConfigApp';

beforeEach(() => localStorage.clear());

describe('ConfigApp', () => {
  test('renders heading and all catalogue categories', () => {
    render(<ConfigApp />);
    expect(screen.getByText(/RootedRewards Config/)).toBeInTheDocument();
    expect(screen.getByText('Contract & Lifecycle')).toBeInTheDocument();
    expect(screen.getByText('App & Data')).toBeInTheDocument();
    expect(screen.getByText('Harvest Hours')).toBeInTheDocument();
    expect(screen.getByText('Energiegedrag')).toBeInTheDocument();
    expect(screen.getByText('Multi-product')).toBeInTheDocument();
  });

  test('renders all catalogue item names', () => {
    render(<ConfigApp />);
    expect(screen.getByText('Welkomstbonus')).toBeInTheDocument();
    expect(screen.getByText('Contract verlengd (1 jaar)')).toBeInTheDocument();
    expect(screen.getByText('App geactiveerd')).toBeInTheDocument();
    expect(screen.getByText('Remote uitlezing uitgezet')).toBeInTheDocument();
  });

  test('shows positive seed values in green and negative in red', () => {
    render(<ConfigApp />);
    const positiveLabel = screen.getByText('+1.000');
    const negativeLabel = screen.getByText('−60');
    expect(positiveLabel).toHaveStyle({ color: '#00a651' });
    expect(negativeLabel).toHaveStyle({ color: '#e2463f' });
  });

  test('toggling a toggle writes to localStorage', () => {
    render(<ConfigApp />);
    // Toggle buttons have aria-label 'Aan' or 'Uit'
    const toggles = screen.getAllByRole('button', { name: /Aan|Uit/ });
    fireEvent.click(toggles[0]);
    const saved = localStorage.getItem('rr-config');
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(parsed.catalogue).toBeDefined();
    expect(Array.isArray(parsed.catalogue)).toBe(true);
  });

  test('Reset button clears localStorage', () => {
    localStorage.setItem('rr-config', JSON.stringify({ catalogue: [] }));
    render(<ConfigApp />);
    fireEvent.click(screen.getByText('Reset'));
    expect(localStorage.getItem('rr-config')).toBeNull();
  });

  test('shows balance and tier in sticky header', () => {
    render(<ConfigApp />);
    // Header shows computed balance — some number of seeds
    expect(screen.getByText(/seeds/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
npx vitest run src/config/__tests__/ConfigApp.test.tsx
```
Expected: FAIL — ConfigApp module not found.

- [ ] **Step 3: Implement ConfigApp**

Create `src/config/ConfigApp.tsx`:

```tsx
import React from 'react';
import { baseInitialState } from '../app/store/initialState';
import type { CatalogueItemStatus } from '../app/store/types';

const CONFIG_KEY = 'rr-config';

type ItemState = {
  name: string;
  seeds: number;
  cat: string;
  status: CatalogueItemStatus;
};

function loadSaved(): Map<string, CatalogueItemStatus> {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return new Map();
    const { catalogue } = JSON.parse(raw) as {
      catalogue: { name: string; status: CatalogueItemStatus }[];
    };
    return new Map(catalogue.map(i => [i.name, i.status]));
  } catch {
    return new Map();
  }
}

function computeBalance(items: ItemState[]): number {
  const raw = items
    .filter(i => i.status === 'claimed' || i.status === 'penalty')
    .reduce((sum, i) => sum + i.seeds, 0);
  return Math.min(10000, Math.max(0, raw));
}

function tierFromBalance(balance: number) {
  if (balance >= 6000) return { emoji: '🌲', name: 'Bos',  mult: 2,   next: null };
  if (balance >= 2500) return { emoji: '🌳', name: 'Boom', mult: 1.5, next: 6000 };
  return                      { emoji: '🌱', name: 'Zaad', mult: 1,   next: 2500 };
}

function seedLabel(seeds: number): string {
  const n = Math.abs(seeds).toLocaleString('nl-NL');
  return seeds >= 0 ? `+${n}` : `−${n}`;
}

function save(items: ItemState[]) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({
    catalogue: items.map(i => ({ name: i.name, status: i.status })),
  }));
}

export function ConfigApp() {
  const saved = loadSaved();

  const [items, setItems] = React.useState<ItemState[]>(() =>
    baseInitialState.catalogue.flatMap(cat =>
      cat.items.map(item => ({
        name: item.name,
        seeds: item.seeds,
        cat: cat.cat,
        status: saved.get(item.name) ?? item.status,
      }))
    )
  );

  const balance = computeBalance(items);
  const tier = tierFromBalance(balance);

  function toggle(name: string) {
    setItems(prev => {
      const next = prev.map(item => {
        if (item.name !== name) return item;
        const newStatus: CatalogueItemStatus =
          item.seeds < 0
            ? item.status === 'penalty'  ? 'available' : 'penalty'
            : item.status === 'claimed' ? 'available' : 'claimed';
        return { ...item, status: newStatus };
      });
      save(next);
      return next;
    });
  }

  function reset() {
    localStorage.removeItem(CONFIG_KEY);
    setItems(
      baseInitialState.catalogue.flatMap(cat =>
        cat.items.map(item => ({ name: item.name, seeds: item.seeds, cat: cat.cat, status: item.status }))
      )
    );
  }

  const categories = baseInitialState.catalogue.map(cat => ({
    name: cat.cat,
    items: items.filter(i => i.cat === cat.cat),
  }));

  const headerStyle: React.CSSProperties = {
    position: 'sticky', top: 0, background: '#fff',
    borderBottom: '1px solid #e5e5e5', zIndex: 10,
  };
  const innerStyle: React.CSSProperties = {
    maxWidth: 760, margin: '0 auto', padding: '12px 24px',
    display: 'flex', alignItems: 'center', gap: 12,
  };
  const btnBase: React.CSSProperties = {
    padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 14,
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh', background: '#f5f5f7' }}>
      <div style={headerStyle}>
        <div style={innerStyle}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>🌱 RootedRewards Config</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 13, color: '#555' }}>
            {balance.toLocaleString('nl-NL')} seeds &nbsp;·&nbsp; {tier.emoji} {tier.name} ({tier.mult}×)
            {tier.next && ` · ${(tier.next - balance).toLocaleString('nl-NL')} to next`}
          </span>
          <button onClick={reset} style={{ ...btnBase, border: '1px solid #ccc', background: '#fff' }}>
            Reset
          </button>
          <button
            onClick={() => { window.location.href = '/app'; }}
            style={{ ...btnBase, border: 'none', background: '#00a651', color: '#fff', fontWeight: 600 }}
          >
            Open App →
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px' }}>
        {categories.map(cat => (
          <div key={cat.name} style={{ marginBottom: 28 }}>
            <h3 style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
              textTransform: 'uppercase', color: '#888', margin: '0 0 8px',
            }}>
              {cat.name}
            </h3>
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e5e5' }}>
              {cat.items.map((item, idx) => {
                const isOn = item.status === 'claimed' || item.status === 'penalty';
                const seedColor = item.seeds < 0 ? '#e2463f' : '#00a651';
                return (
                  <div key={item.name} style={{
                    display: 'flex', alignItems: 'center', padding: '11px 16px',
                    borderTop: idx > 0 ? '1px solid #f0f0f0' : 'none',
                  }}>
                    <span style={{ flex: 1, fontSize: 14 }}>{item.name}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: seedColor, minWidth: 72, textAlign: 'right', marginRight: 20 }}>
                      {seedLabel(item.seeds)}
                    </span>
                    <button
                      aria-label={isOn ? 'Aan' : 'Uit'}
                      onClick={() => toggle(item.name)}
                      style={{
                        width: 44, height: 24, borderRadius: 12, border: 'none',
                        cursor: 'pointer', background: isOn ? '#00a651' : '#ddd',
                        position: 'relative', transition: 'background 0.15s', flexShrink: 0,
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 2,
                        left: isOn ? 22 : 2, width: 20, height: 20,
                        borderRadius: 10, background: '#fff',
                        transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                      }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/config/__tests__/ConfigApp.test.tsx
```
Expected: all 6 tests pass.

> **Note on the toggle test:** The toggle buttons have `aria-label="Aan"` or `aria-label="Uit"`. The test uses `getAllByRole('button', { name: '' })` which won't match labeled buttons. If the test fails on `getAllByRole`, change to `getAllByRole('button')` and filter out the named "Reset" and "Open App →" buttons.

- [ ] **Step 6: Run full test suite**

```bash
npx vitest run
```
Expected: all test files pass.

---

## Task 5: Migrate Screen Files

**Files:**
- Modify: `src/app/screens/dashboard.jsx`
- Modify: `src/app/screens/ledger.jsx`
- Modify: `src/app/screens/catalogue.jsx`
- Modify: `src/app/screens/tiers.jsx`
- Modify: `src/app/screens/harvest.jsx`

Each screen needs exactly two changes:
1. Replace the static import with the hook import
2. Change `const R = RR` (or equivalent) to `const R = useRR()`

- [ ] **Step 1: Migrate dashboard.jsx**

In `src/app/screens/dashboard.jsx`:

Find and replace:
```jsx
import RR from '../data.jsx'
```
With:
```jsx
import { useRR } from '../store/RRContext.tsx'
```

Then, inside the `Dashboard` function, find:
```jsx
const R = RR;
```
Replace with:
```jsx
const R = useRR();
```

- [ ] **Step 2: Migrate ledger.jsx**

In `src/app/screens/ledger.jsx`:

Replace:
```jsx
import RR from '../data.jsx'
```
With:
```jsx
import { useRR } from '../store/RRContext.tsx'
```

Inside the `Ledger` function, find:
```jsx
const R = RR;
```
Replace with:
```jsx
const R = useRR();
```

- [ ] **Step 3: Migrate catalogue.jsx**

In `src/app/screens/catalogue.jsx`:

Replace:
```jsx
import RR from '../data.jsx'
```
With:
```jsx
import { useRR } from '../store/RRContext.tsx'
```

Find the component function that uses `RR` (likely `Catalogue`). Look for `const R = RR` or direct `RR.` usage. If it uses `const R = RR`, replace with `const R = useRR()` inside the function. If it uses `RR.` directly, add `const R = useRR()` at the top of the component and replace all `RR.` with `R.`.

- [ ] **Step 4: Migrate tiers.jsx**

In `src/app/screens/tiers.jsx`:

Replace:
```jsx
import RR from '../data.jsx'
```
With:
```jsx
import { useRR } from '../store/RRContext.tsx'
```

Apply the same `const R = useRR()` swap inside the component function.

- [ ] **Step 5: Migrate harvest.jsx**

In `src/app/screens/harvest.jsx`:

Replace:
```jsx
import RR from '../data.jsx'
```
With:
```jsx
import { useRR } from '../store/RRContext.tsx'
```

Apply the same `const R = useRR()` swap inside the component function.

- [ ] **Step 6: Verify TypeScript compiles with no errors**

```bash
npx tsc --noEmit
```
Expected: no errors.

---

## Task 6: Final Verification + Commit

- [ ] **Step 1: Run the full test suite**

```bash
npx vitest run
```
Expected: all test files pass.

- [ ] **Step 2: Start the dev server and verify /config**

```bash
npm run dev
```

Open `http://localhost:5173/config`.  
Expected:
- Config page loads with sticky header showing balance + tier
- All 5 catalogue categories visible with seed values and toggles
- Toggle any item → balance in header updates immediately
- Negative seed item (Remote uitlezing uitgezet) shows −60 in red
- Reset button resets all toggles to defaults

- [ ] **Step 3: Verify /app reflects config**

While dev server is running:
1. Toggle a few items in `/config` (e.g. claim "Contract verlengd (1 jaar)")
2. Click "Open App →" or navigate to `http://localhost:5173/app`
3. Expected: balance in the app matches what config computed

- [ ] **Step 4: Commit everything**

```bash
git add \
  src/app/store/initialState.ts \
  src/app/store/__tests__/loadFromConfig.test.ts \
  vite.config.ts \
  config/index.html \
  src/config/main.tsx \
  src/config/ConfigApp.tsx \
  src/config/__tests__/ConfigApp.test.tsx \
  src/app/screens/dashboard.jsx \
  src/app/screens/ledger.jsx \
  src/app/screens/catalogue.jsx \
  src/app/screens/tiers.jsx \
  src/app/screens/harvest.jsx \
  docs/superpowers/specs/2026-06-03-config-page-design.md \
  docs/superpowers/plans/2026-06-03-config-page.md

git commit -m "feat: add /config demo setup page and migrate screens to useRR()"
```

---

*RootedRewards Config Page | Budget Thuis Hackathon 2026*
