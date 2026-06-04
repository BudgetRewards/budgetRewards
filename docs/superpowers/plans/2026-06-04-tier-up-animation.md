# Tier-Up Growth Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Play a full-screen growth animation (seed → tree → forest) whenever a customer crosses up into a higher loyalty tier during normal app use.

**Architecture:** State-driven, mirroring the existing weekend `pendingReward` → `RewardToast` pattern. The reducer detects an upward tier crossing and sets `pendingTierUp`; a new `<TierUpCelebration/>` in the app shell reads it, plays the animation, and dispatches `DISMISS_TIER_UP` on tap. Tiers never demote, so each crossing fires exactly once.

**Tech Stack:** Vite + React 19 + TypeScript, Vitest + jsdom + @testing-library/react. Reducer/state in TypeScript under `src/app/store/`; screens/components in JSX under `src/app/`.

**Spec:** `docs/superpowers/specs/2026-06-04-tier-up-animation-design.md`

---

## File Structure

| File | Responsibility | Change |
| --- | --- | --- |
| `src/app/store/types.ts` | State + action shapes | add `pendingTierUp` to `RRState`; add `DISMISS_TIER_UP` to `RRAction` |
| `src/app/store/initialState.ts` | Default state | initialize `pendingTierUp: null` |
| `src/app/store/reducer.ts` | Tier-up detection + dismiss | export `TIER_MULTIPLIERS`; add `tierUpFor`; set `pendingTierUp` in APPLY_TRIGGER + weekend paths; handle `DISMISS_TIER_UP` |
| `src/app/store/RRContext.tsx` | Trigger API | expose `dismissTierUp()` |
| `src/app/i18n.jsx` | Copy (nl + en) | add `tierUp` block |
| `src/app/TierUpCelebration.jsx` (new) | Overlay component | presentational `TierUpCelebrationView` + connected `TierUpCelebration` |
| `src/app/TierUpCelebration.css` (new) | Scoped animation styles | `.tu-root` scope, `tu-`-prefixed keyframes, reduced-motion |
| `src/app/app.jsx` | App shell | render `<TierUpCelebration/>` |
| `src/app/store/__tests__/reducer.test.ts` | Reducer tests | tier-up on APPLY_TRIGGER, no-fire on onboarding/same-tier, DISMISS_TIER_UP |
| `src/app/store/__tests__/weekendReward.test.ts` | Weekend tests | tier-up via a weekend reward crossing |
| `src/app/__tests__/TierUpCelebration.test.jsx` (new) | Component test | renders copy, Continue calls onDismiss |

---

## Task 1: State + action plumbing

Adds the `pendingTierUp` field and the `DISMISS_TIER_UP` action so the reducer tests in Task 2 compile. No detection logic yet.

**Files:**
- Modify: `src/app/store/types.ts`
- Modify: `src/app/store/initialState.ts`

- [ ] **Step 1: Add the state field**

In `src/app/store/types.ts`, inside the `RRState` type, directly after the `pendingReward` line (currently the last field before the closing `};`):

```ts
  /** The most recent weekend reward, shown as a toast until dismissed. */
  pendingReward: { amount: number; weekend: string; weekendEn: string } | null;
  /** The most recent upward tier crossing, shown as a full-screen celebration until dismissed. */
  pendingTierUp: { from: TierKey; to: TierKey } | null;
};
```

`TierKey` is already imported/defined in this file (it is used by `currentTier: TierKey`), so no new import is needed.

- [ ] **Step 2: Add the dismiss action**

In `src/app/store/types.ts`, extend the `RRAction` union — add the new member after `DISMISS_REWARD`:

```ts
export type RRAction =
  | { type: 'APPLY_TRIGGER'; payload: TriggerPayload }
  | { type: 'APPLY_ONBOARDING'; profile: Profile }
  | { type: 'SET_USAGE'; payload: UsageRecord }
  | { type: 'SELECT_USAGE_DATE'; payload: { date: string } }
  | { type: 'MARK_HISTORY_SEEN' }
  | { type: 'DISMISS_REWARD' }
  | { type: 'DISMISS_TIER_UP' };
```

- [ ] **Step 3: Initialize the field**

In `src/app/store/initialState.ts`, in the `baseInitialState` object, change the final `pendingReward: null,` line to:

```ts
  pendingReward: null,
  pendingTierUp: null,
};
```

`loadFromConfig` returns `{ ...base, ... }` and never sets a tier-up, so the `null` is carried through to `initialState` automatically — no further change needed here.

- [ ] **Step 4: Type-check**

Run: `npm run build`
Expected: PASS (compiles with no type errors). The new field is present everywhere `RRState` is constructed via spread.

- [ ] **Step 5: Commit**

```bash
git add src/app/store/types.ts src/app/store/initialState.ts
git commit -m "feat: add pendingTierUp state field and DISMISS_TIER_UP action"
```

---

## Task 2: Reducer detection (APPLY_TRIGGER) + dismiss

TDD the core detection: an upward crossing during an earning sets `pendingTierUp`; same-tier earnings and onboarding leave it `null`; `DISMISS_TIER_UP` clears it.

**Files:**
- Test: `src/app/store/__tests__/reducer.test.ts`
- Modify: `src/app/store/reducer.ts`

- [ ] **Step 1: Write the failing tests**

In `src/app/store/__tests__/reducer.test.ts`, add a new `describe` block at the end of the file (after the closing `});` of the `APPLY_ONBOARDING` block):

```ts
describe('pendingTierUp (tier-up celebration)', () => {
  test('sets pendingTierUp when an earning crosses seed → tree', () => {
    const near = { ...freshState, balance: 2400 };
    const next = apply(near, { name: 'Test', cat: 'App & Data', base: 200, kind: 'pos' });
    expect(next.currentTier).toBe('tree');
    expect(next.pendingTierUp).toEqual({ from: 'seed', to: 'tree' });
  });

  test('sets pendingTierUp when an earning crosses tree → forest', () => {
    const near = { ...freshState, balance: 5900, currentTier: 'tree' as const, multiplier: 1.5 };
    const next = apply(near, { name: 'Test', cat: 'App & Data', base: 200, kind: 'pos' });
    expect(next.currentTier).toBe('forest');
    expect(next.pendingTierUp).toEqual({ from: 'tree', to: 'forest' });
  });

  test('leaves pendingTierUp null when the earning does not change tier', () => {
    const next = apply(freshState, { name: 'Test', cat: 'App & Data', base: 100, kind: 'pos' });
    expect(next.currentTier).toBe('seed');
    expect(next.pendingTierUp).toBeNull();
  });

  test('does not celebrate onboarding placement into a higher tier', () => {
    const next = reducer(freshState, {
      type: 'APPLY_ONBOARDING',
      profile: { solarPanels: true, homeBattery: true, householdSize: 4, customerYears: 5, products: ['electricity', 'gas', 'internet', 'tv'] },
    });
    expect(next.currentTier).toBe('tree');
    expect(next.pendingTierUp).toBeNull();
  });

  test('DISMISS_TIER_UP clears pendingTierUp', () => {
    const near = { ...freshState, balance: 2400 };
    let s = apply(near, { name: 'Test', cat: 'App & Data', base: 200, kind: 'pos' });
    expect(s.pendingTierUp).not.toBeNull();
    s = reducer(s, { type: 'DISMISS_TIER_UP' });
    expect(s.pendingTierUp).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:run -- src/app/store/__tests__/reducer.test.ts`
Expected: FAIL — the four "sets/clears" assertions fail (`pendingTierUp` is `null`/unchanged because no detection or handler exists yet). The "leaves null" and onboarding tests may already pass.

- [ ] **Step 3: Add the `tierUpFor` helper and export `TIER_MULTIPLIERS`**

In `src/app/store/reducer.ts`, change the `TIER_MULTIPLIERS` declaration to be exported (the component will reuse it):

```ts
export const TIER_MULTIPLIERS: Record<TierKey, number> = {
  seed: 1,
  tree: 1.5,
  forest: 2,
};
```

Then, directly after the existing `evaluateTier` function (before `nextTierFor`), add:

```ts
/** Returns the crossing when newTier is a higher tier than oldTier, else null. */
function tierUpFor(oldTier: TierKey, newTier: TierKey): { from: TierKey; to: TierKey } | null {
  return TIER_ORDER.indexOf(newTier) > TIER_ORDER.indexOf(oldTier)
    ? { from: oldTier, to: newTier }
    : null;
}
```

- [ ] **Step 4: Detect the crossing in the APPLY_TRIGGER branch**

In `src/app/store/reducer.ts`, the APPLY_TRIGGER branch ends with this return (currently the last statement of the reducer):

```ts
  return {
    ...state,
    ...patch,
    catalogue: newCatalogue,
    harvest: newHarvest,
    remoteReadEnabled: setRemoteRead !== undefined ? setRemoteRead : state.remoteReadEnabled,
  };
```

Immediately **before** that `return`, compute the crossing (the `patch` is `{}` for a zero-value trigger, so guard with an `in` check):

```ts
  const newTierAfterTrigger = 'currentTier' in patch ? patch.currentTier : undefined;
  const triggerTierUp = newTierAfterTrigger
    ? tierUpFor(state.currentTier, newTierAfterTrigger)
    : null;
```

Then add one line to the returned object so an existing un-dismissed celebration is preserved when this earning doesn't itself cross a tier:

```ts
  return {
    ...state,
    ...patch,
    catalogue: newCatalogue,
    harvest: newHarvest,
    remoteReadEnabled: setRemoteRead !== undefined ? setRemoteRead : state.remoteReadEnabled,
    pendingTierUp: triggerTierUp ?? state.pendingTierUp,
  };
```

- [ ] **Step 5: Add the DISMISS_TIER_UP handler**

In `src/app/store/reducer.ts`, directly after the existing `DISMISS_REWARD` handler:

```ts
  if (action.type === 'DISMISS_REWARD') {
    return state.pendingReward ? { ...state, pendingReward: null } : state;
  }
  if (action.type === 'DISMISS_TIER_UP') {
    return state.pendingTierUp ? { ...state, pendingTierUp: null } : state;
  }
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm run test:run -- src/app/store/__tests__/reducer.test.ts`
Expected: PASS (all tests, including the existing ones).

- [ ] **Step 7: Commit**

```bash
git add src/app/store/reducer.ts src/app/store/__tests__/reducer.test.ts
git commit -m "feat: detect upward tier crossings and set pendingTierUp on earnings"
```

---

## Task 3: Reducer detection (weekend reward path)

A weekend reward can also push the balance over a threshold. TDD that path.

**Files:**
- Test: `src/app/store/__tests__/weekendReward.test.ts`
- Modify: `src/app/store/reducer.ts`

- [ ] **Step 1: Write the failing test**

In `src/app/store/__tests__/weekendReward.test.ts`, add this test inside the existing `describe('weekend reward (SET_USAGE)', () => { ... })` block:

```ts
  test('a weekend reward that crosses a threshold sets pendingTierUp', () => {
    // Weekend reward is 20 seeds; start at 2480 with electricity so the
    // completed weekend pushes the balance to 2500 (seed → tree).
    let s = withElectricity({ ...initialState, balance: 2480, currentTier: 'seed', multiplier: 1, pendingTierUp: null });
    s = setUsage(s, '2026-05-02', 2, 1); // Saturday earned
    expect(s.pendingTierUp).toBeNull();   // weekend not complete yet
    s = setUsage(s, '2026-05-03', 2, 1); // Sunday earned — weekend complete, +20 → 2500
    expect(s.currentTier).toBe('tree');
    expect(s.pendingTierUp).toEqual({ from: 'seed', to: 'tree' });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/app/store/__tests__/weekendReward.test.ts`
Expected: FAIL — `pendingTierUp` is `null` after the weekend completes (the weekend branch doesn't set it yet).

- [ ] **Step 3: Detect the crossing in the SET_USAGE weekend branch**

In `src/app/store/reducer.ts`, the weekend branch currently builds `next` like this:

```ts
      next = {
        ...next,
        ...patch,
        awardedWeekends: [...state.awardedWeekends, weekend.id],
        historyUnseen: true,
        // Only celebrate an actual earning; a missed weekend just shows in history.
        pendingReward: earned ? { amount: entry.amount, weekend: labels.nl, weekendEn: labels.en } : state.pendingReward,
      };
```

Directly **before** that assignment, compute the crossing from the pre-patch tier (`next.currentTier`) to the post-patch tier (`patch.currentTier`):

```ts
      const weekendTierUp = tierUpFor(next.currentTier, patch.currentTier);
```

Then add one line to the `next` object:

```ts
      next = {
        ...next,
        ...patch,
        awardedWeekends: [...state.awardedWeekends, weekend.id],
        historyUnseen: true,
        // Only celebrate an actual earning; a missed weekend just shows in history.
        pendingReward: earned ? { amount: entry.amount, weekend: labels.nl, weekendEn: labels.en } : state.pendingReward,
        pendingTierUp: weekendTierUp ?? next.pendingTierUp,
      };
```

A missed weekend adds nothing to the balance, so `patch.currentTier === next.currentTier` and `weekendTierUp` is `null` — no false celebration.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:run -- src/app/store/__tests__/weekendReward.test.ts`
Expected: PASS (new test plus all existing weekend tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/store/reducer.ts src/app/store/__tests__/weekendReward.test.ts
git commit -m "feat: set pendingTierUp when a weekend reward crosses a tier"
```

---

## Task 4: Expose `dismissTierUp` in the trigger API

**Files:**
- Modify: `src/app/store/RRContext.tsx`

- [ ] **Step 1: Add the trigger**

In `src/app/store/RRContext.tsx`, in the object returned by `useTrigger`, directly after the `dismissReward` line:

```ts
    dismissReward:       ()                                  => dispatch({ type: 'DISMISS_REWARD' }),
    dismissTierUp:       ()                                  => dispatch({ type: 'DISMISS_TIER_UP' }),
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/store/RRContext.tsx
git commit -m "feat: expose dismissTierUp trigger"
```

---

## Task 5: Add tier-up copy (nl + en)

**Files:**
- Modify: `src/app/i18n.jsx`

- [ ] **Step 1: Add the Dutch copy**

In `src/app/i18n.jsx`, inside the `nl:` locale object, the `toast` block currently reads:

```js
    toast: {
      delivered: n => `${n} seeds geleverd!`,
      weekendEarned: w => `Oogstweekend ${w} — beide dagen verdiend`,
      tapToView: 'Tik om je historie te bekijken',
    },
```

Add a `tierUp` block immediately after that closing `},`:

```js
    tierUp: {
      title: name => `Je bent gegroeid naar ${name}!`,
      multiplierNow: m => `Je multiplier is nu ${m}×`,
      continue: 'Doorgaan',
    },
```

- [ ] **Step 2: Add the English copy**

In `src/app/i18n.jsx`, inside the `en:` locale object, the `toast` block currently reads:

```js
    toast: {
      delivered: n => `${n} seeds delivered!`,
      weekendEarned: w => `Harvest weekend ${w} — both days earned`,
      tapToView: 'Tap to view your history',
    },
```

Add a `tierUp` block immediately after that closing `},`:

```js
    tierUp: {
      title: name => `You've grown to ${name}!`,
      multiplierNow: m => `Your multiplier is now ${m}×`,
      continue: 'Continue',
    },
```

- [ ] **Step 3: Type-check**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/i18n.jsx
git commit -m "feat: add tier-up celebration copy (nl + en)"
```

---

## Task 6: TierUpCelebration component + styles + test

A presentational `TierUpCelebrationView` (props only — easy to test) plus the scoped CSS. The connected wrapper is added in Task 7.

**Files:**
- Create: `src/app/TierUpCelebration.css`
- Create: `src/app/TierUpCelebration.jsx`
- Test: `src/app/__tests__/TierUpCelebration.test.jsx`

- [ ] **Step 1: Write the scoped CSS**

Create `src/app/TierUpCelebration.css`:

```css
/* All rules scoped under .tu-root; keyframes prefixed tu- to avoid global collisions. */
.tu-root{
  position:absolute; inset:0; z-index:100;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  background:rgba(4,65,42,0.55); backdrop-filter:blur(4px);
  animation:tu-fade 0.3s ease-out both;
}
@keyframes tu-fade{ from{ opacity:0; } to{ opacity:1; } }

.tu-stage{
  width:240px; height:240px; position:relative;
  display:flex; align-items:flex-end; justify-content:center;
}
.tu-ground{ position:absolute; bottom:0; left:0; right:0; height:30px;
  background:linear-gradient(180deg,#bfe9cf,#a9dcc0); border-radius:0 0 16px 16px; }
.tu-shadow{ position:absolute; bottom:20px; left:50%; width:140px; height:18px;
  transform:translateX(-50%); background:rgba(4,65,42,.22); border-radius:50%; filter:blur(3px); }

.tu-grow{ transform-origin:bottom center;
  animation:tu-grow 2.2s cubic-bezier(.34,1.3,.5,1) both; }
@keyframes tu-grow{
  0%{ transform:scaleY(.04) scaleX(.5); opacity:.3; }
  70%{ transform:none; opacity:1; }
  100%{ transform:none; opacity:1; }
}
.tu-pop{ transform-origin:center bottom; opacity:0;
  animation:tu-pop 2.2s cubic-bezier(.34,1.4,.5,1) both; }
@keyframes tu-pop{
  0%,30%{ transform:scale(0); opacity:0; }
  48%{ transform:scale(1.06); opacity:1; }
  56%,100%{ transform:scale(1); opacity:1; }
}
.tu-d1{ animation-delay:.06s; } .tu-d2{ animation-delay:.12s; } .tu-d3{ animation-delay:.18s; }
.tu-d4{ animation-delay:.24s; } .tu-d5{ animation-delay:.30s; } .tu-d6{ animation-delay:.36s; }
.tu-d7{ animation-delay:.42s; } .tu-d8{ animation-delay:.48s; } .tu-d9{ animation-delay:.54s; }

.tu-copy{ text-align:center; margin-top:18px; padding:0 28px;
  animation:tu-rise 0.5s ease-out 1.6s both; }
@keyframes tu-rise{ from{ opacity:0; transform:translateY(12px); } to{ opacity:1; transform:none; } }
.tu-title{ color:#fff; font-weight:800; font-size:22px; letter-spacing:-0.3px; margin:0; }
.tu-sub{ color:rgba(255,255,255,0.88); font-weight:600; font-size:14px; margin:8px 0 0; }

.tu-continue{
  margin-top:22px; border:none; cursor:pointer;
  background:#fff; color:#04412a; font-family:inherit; font-weight:800; font-size:15px;
  padding:13px 34px; border-radius:99px; box-shadow:0 8px 24px rgba(0,0,0,0.22);
  animation:tu-rise 0.5s ease-out 1.7s both;
}

@media (prefers-reduced-motion: reduce){
  .tu-root, .tu-grow, .tu-pop, .tu-copy, .tu-continue{ animation:none !important; opacity:1 !important; }
  .tu-grow, .tu-pop{ transform:none !important; }
}
```

- [ ] **Step 2: Write the component**

Create `src/app/TierUpCelebration.jsx`. `Tree` is a reusable SVG; the view renders one tree for `tree` and a three-tree grove for `forest`. The connected wrapper resolves copy and dispatches dismiss.

```jsx
import React from 'react'
import './TierUpCelebration.css'
import { useRR, useTrigger } from './store/RRContext.tsx'
import { TIER_MULTIPLIERS } from './store/reducer.ts'
import { useT, useLang, tName } from './i18n.jsx'

/* A single layered-foliage tree: brown trunk + limbs, 10 leaf clusters in 3-4 green tones.
   `animate` drives the grow/pop entrance; pass false for the smaller grove trees. */
function Tree({ scale = 1, animate = true }) {
  const grow = animate ? 'tu-grow' : ''
  const pop = (n) => (animate ? `tu-pop tu-d${n}` : '')
  return (
    <svg className={grow} viewBox="0 0 220 250" width={230 * scale} height={260 * scale}>
      <path d="M104 244 C101 196 99 162 106 128 L116 128 C123 162 121 200 119 244 Z" fill="#6b4a2b"/>
      <path d="M110 162 C92 152 80 138 72 122" stroke="#6b4a2b" strokeWidth="8" fill="none" strokeLinecap="round"/>
      <path d="M112 150 C132 142 146 130 156 114" stroke="#6b4a2b" strokeWidth="8" fill="none" strokeLinecap="round"/>
      <path d="M110 140 C108 120 112 104 120 90" stroke="#6b4a2b" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <circle className={pop(1)} cx="110" cy="86"  r="50" fill="#2e7d32"/>
      <circle className={pop(2)} cx="62"  cy="108" r="36" fill="#327f36"/>
      <circle className={pop(3)} cx="158" cy="106" r="36" fill="#327f36"/>
      <circle className={pop(4)} cx="84"  cy="74"  r="34" fill="#3a9140"/>
      <circle className={pop(5)} cx="140" cy="72"  r="34" fill="#3a9140"/>
      <circle className={pop(6)} cx="110" cy="52"  r="32" fill="#46a34c"/>
      <circle className={pop(7)} cx="48"  cy="86"  r="26" fill="#52b35a"/>
      <circle className={pop(8)} cx="172" cy="86"  r="26" fill="#52b35a"/>
      <circle className={pop(9)} cx="92"  cy="50"  r="22" fill="#6ac46f"/>
      <circle className={pop(9)} cx="132" cy="50"  r="22" fill="#6ac46f"/>
    </svg>
  )
}

/* Presentational overlay. Props only — no store/i18n hooks, so it is trivially testable. */
export function TierUpCelebrationView({ to, title, subtitle, continueLabel, onDismiss }) {
  return (
    <div className="tu-root" onClick={onDismiss}>
      <div className="tu-stage" onClick={(e) => e.stopPropagation()}>
        <div className="tu-ground"/>
        <div className="tu-shadow"/>
        {to === 'forest' ? (
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
            <div style={{ marginRight:-40 }}><Tree scale={0.62} animate={false}/></div>
            <Tree scale={0.85}/>
            <div style={{ marginLeft:-40 }}><Tree scale={0.56} animate={false}/></div>
          </div>
        ) : (
          <Tree/>
        )}
      </div>
      <div className="tu-copy">
        <p className="tu-title">{title}</p>
        <p className="tu-sub">{subtitle}</p>
      </div>
      <button className="tu-continue" onClick={onDismiss}>{continueLabel}</button>
    </div>
  )
}

/* Connected wrapper: reads pendingTierUp, resolves localized copy, dispatches dismiss. */
export function TierUpCelebration() {
  const R = useRR()
  const t = useT()
  const { lang } = useLang()
  const { dismissTierUp } = useTrigger()

  if (!R.pendingTierUp) return null
  const { to } = R.pendingTierUp
  const tier = R.tiers.find(x => x.id === to)
  const tierName = tier ? tName(tier, lang) : to
  const mult = TIER_MULTIPLIERS[to]
  const multStr = mult.toLocaleString(lang === 'en' ? 'en-US' : 'nl-NL')

  return (
    <TierUpCelebrationView
      to={to}
      title={t.tierUp.title(tierName)}
      subtitle={t.tierUp.multiplierNow(multStr)}
      continueLabel={t.tierUp.continue}
      onDismiss={dismissTierUp}
    />
  )
}
```

- [ ] **Step 3: Write the component test**

Create `src/app/__tests__/TierUpCelebration.test.jsx`:

```jsx
import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TierUpCelebrationView } from '../TierUpCelebration.jsx'

describe('TierUpCelebrationView', () => {
  test('renders title + subtitle and calls onDismiss when Continue is clicked', () => {
    const onDismiss = vi.fn()
    render(
      <TierUpCelebrationView
        to="tree"
        title="You've grown to Tree!"
        subtitle="Your multiplier is now 1.5×"
        continueLabel="Continue"
        onDismiss={onDismiss}
      />
    )
    expect(screen.getByText("You've grown to Tree!")).toBeInTheDocument()
    expect(screen.getByText('Your multiplier is now 1.5×')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  test('renders three trees for the forest crossing', () => {
    const { container } = render(
      <TierUpCelebrationView
        to="forest"
        title="You've grown to Forest!"
        subtitle="Your multiplier is now 2×"
        continueLabel="Continue"
        onDismiss={() => {}}
      />
    )
    expect(container.querySelectorAll('svg').length).toBe(3)
  })
})
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test:run -- src/app/__tests__/TierUpCelebration.test.jsx`
Expected: PASS (both tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/TierUpCelebration.jsx src/app/TierUpCelebration.css src/app/__tests__/TierUpCelebration.test.jsx
git commit -m "feat: add TierUpCelebration overlay component"
```

---

## Task 7: Wire the overlay into the app shell

**Files:**
- Modify: `src/app/app.jsx`

- [ ] **Step 1: Import the component**

In `src/app/app.jsx`, after the existing `NotificationQueue` import:

```jsx
import { NotificationQueue } from './NotificationQueue.jsx'
import { TierUpCelebration } from './TierUpCelebration.jsx'
```

- [ ] **Step 2: Render it in the shell**

In `src/app/app.jsx`, inside the `App` component's returned `<div className="rr rr-app">`, add `<TierUpCelebration/>` next to `<RewardToast/>`:

```jsx
      <FullscreenHint/>
      <RewardToast onView={()=>go('history')}/>
      <TierUpCelebration/>
```

The overlay is `position:absolute; inset:0` and self-hides when `pendingTierUp` is null, so placement among the other absolutely-positioned shell elements is fine. It sits above them via `z-index:100`.

- [ ] **Step 3: Build + lint**

Run: `npm run build` then `npm run lint`
Expected: both PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/app.jsx
git commit -m "feat: render TierUpCelebration in the app shell"
```

---

## Task 8: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm run test:run`
Expected: PASS — all suites, including the new reducer, weekend, and component tests.

- [ ] **Step 2: Build + lint**

Run: `npm run build` then `npm run lint`
Expected: both PASS.

- [ ] **Step 3: Manual check in the dev server**

Run: `npm run dev`, open the app on a mobile viewport (or the iOS frame), complete onboarding, then claim enough seeds (catalogue items / notification cards) to cross 2500.
Expected: the full-screen overlay appears, the tree grows from the ground, the title shows "Je bent gegroeid naar Boom!" (nl) / "You've grown to Tree!" (en) with the new multiplier, and tapping **Continue** or the backdrop dismisses it. Crossing 6000 shows the three-tree grove. No overlay appears on a fresh onboarding that lands directly in tree/forest.

- [ ] **Step 4: Reduced-motion check**

In browser devtools, enable "Emulate prefers-reduced-motion: reduce" and trigger a crossing.
Expected: the final tree frame + copy + button appear immediately with no growth animation.

---

## Self-Review notes

- **Spec coverage:** behavior/trigger (Tasks 2–3, 7), no-onboarding rule (Task 2 test + reducer leaves `pendingTierUp` untouched in APPLY_ONBOARDING), tap-to-continue + backdrop dismiss (Task 6 view + Task 2 handler), every-upward-crossing (`tierUpFor` index compare), visual style/grove (Task 6), copy nl+en (Task 5), state mirroring `pendingReward` (Tasks 1–4), reduced-motion (Task 6 CSS + Task 8), tests (Tasks 2,3,6,8). All covered.
- **Type consistency:** `pendingTierUp: { from: TierKey; to: TierKey } | null` and `tierUpFor` return type match; `TIER_MULTIPLIERS` exported in Task 2 and imported in Task 6; `DISMISS_TIER_UP` added to `RRAction` (Task 1) and handled (Task 2) and dispatched (Task 4).
- **No placeholders:** every code/test step shows complete content.
