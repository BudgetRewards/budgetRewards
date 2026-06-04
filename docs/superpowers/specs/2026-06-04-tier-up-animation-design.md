# Tier-up growth animation — design

**Date:** 2026-06-04
**Status:** Approved (pending implementation plan)

## Problem

Crossing into a higher loyalty tier (seed → tree → forest) is a milestone, but today it
happens silently — the balance ticks over and the Tiers screen quietly reflects the new
status. We want a celebratory, on-brand moment that makes growth feel earned.

## Goal

When a customer crosses **up** into a higher tier during normal app use, play a full-screen
growth animation:

- **seed → tree:** a tree grows from the ground.
- **tree → forest:** the tree shrinks and two more grow in beside it, forming a grove.

## Behavior

- **Trigger:** a balance change that moves `currentTier` up an index — from claiming a
  gamified notification, a catalogue item, or a weekend reward.
- **Presentation:** full-screen takeover. Dimmed backdrop, growth animation center stage,
  then a title + subtitle and a **Continue** button.
- **Dismiss:** tap **Continue** or tap the backdrop. No auto-dismiss.
- **Re-trigger rule:** fires on **every upward crossing**. Because tiers never demote
  (see below), each crossing happens exactly once anyway — no "already celebrated"
  bookkeeping is required.
- **Onboarding excluded:** `APPLY_ONBOARDING` can place a new customer directly in tree or
  forest based on their profile. That is initial placement, not growth, and must **not**
  trigger the celebration.

### Tiers are monotonic (key invariant)

`evaluateTier(balance, current)` in `reducer.ts` only ever returns a tier whose order index
is `>= current` — it never demotes, even if the balance later drops. The Tiers screen states
this explicitly ("Tiers never go down" / "Tiers gaan nooit omlaag"). Therefore detecting an
upward crossing is simply: the new tier's `TIER_ORDER` index is greater than the old tier's.

## Visual style (locked via visual companion)

Layered-foliage illustration, filled (not outline):

- Brown trunk (`#6b4a2b`) with two or three tapering limbs.
- Canopy built from ~10 overlapping circular leaf clusters in 3–4 green tones
  (e.g. `#2e7d32`, `#327f36`, `#3a9140`, `#46a34c`, `#52b35a`, `#6ac46f`).
- Soft ground strip + blurred shadow ellipse beneath the tree.

**Animation:**

- Trunk + canopy group grows from the ground via `scaleY` with a slight spring
  (`cubic-bezier(.34,1.3,.5,1)`), ~transform-origin bottom center.
- Foliage clusters `pop` in, staggered (~60ms apart), after the trunk.
- Total growth ~2.5s; then the title/subtitle/Continue fade in.
- **Forest variant** (`to === 'forest'`): the full tree scales down and shifts left while two
  additional trees (smaller, varying scale/opacity) grow in beside it to form a grove.
- **Accessibility:** `prefers-reduced-motion` skips the growth and renders the final frame
  immediately (title/subtitle/Continue still shown).

Reference mockups live in `.superpowers/brainstorm/` (`visual-style-A-fuller.html`).

## Architecture (Approach A — state-driven, mirrors `pendingReward`)

The celebration is driven by store state, exactly like the existing weekend `RewardToast`
(`pendingReward` → toast → `DISMISS_REWARD`). Detection is centralized in the reducer so no
earning path can slip through.

### State (`src/app/store/types.ts`)

Add to `RRState`:

```ts
/** The most recent upward tier crossing, shown as a full-screen celebration until dismissed. */
pendingTierUp: { from: TierKey; to: TierKey } | null;
```

### Initial state (`src/app/store/initialState.ts`)

`pendingTierUp: null` (in both the base state and any derived `loadFromConfig` path —
loading from config is initial placement, so it stays `null`).

### Reducer (`src/app/store/reducer.ts`)

- Add a helper:

  ```ts
  function tierUpFor(oldTier: TierKey, newTier: TierKey): { from: TierKey; to: TierKey } | null {
    return TIER_ORDER.indexOf(newTier) > TIER_ORDER.indexOf(oldTier)
      ? { from: oldTier, to: newTier }
      : null;
  }
  ```

- In the **APPLY_TRIGGER** branch: after `patch` is computed, if `patch.currentTier` exists
  and `tierUpFor(state.currentTier, patch.currentTier)` is non-null, include
  `pendingTierUp` in the returned state. (A zero-value trigger produces an empty patch and no
  tier change, so it is naturally skipped.)
- In the **SET_USAGE** weekend-reward branch: same check using the pre-/post-earning tier,
  set `pendingTierUp` on the `next` state when the weekend reward pushes the customer up a
  tier.
- **APPLY_ONBOARDING:** leave `pendingTierUp` untouched (`null`) — initial placement.
- New action `DISMISS_TIER_UP`:

  ```ts
  if (action.type === 'DISMISS_TIER_UP') {
    return state.pendingTierUp ? { ...state, pendingTierUp: null } : state;
  }
  ```

- Add `DISMISS_TIER_UP` to the `RRAction` union in `types.ts`.

### Context (`src/app/store/RRContext.tsx`)

Expose in `useTrigger`:

```ts
dismissTierUp: () => dispatch({ type: 'DISMISS_TIER_UP' }),
```

### Component (`src/app/TierUpCelebration.jsx` + scoped CSS)

- Rendered in the app shell (`app.jsx`) alongside `<RewardToast/>`.
- Reads `pendingTierUp` from `useRR()`; returns `null` when it is `null`.
- Inline SVG tree built from the approved mockup. When `to === 'forest'`, renders the grove
  variant.
- Keyframe names prefixed `tu-` to avoid global collisions; CSS scoped under a root class
  (consistent with the `cs-`/`ComingSoon` convention in the codebase).
- Title + subtitle + **Continue** button below the animation; **Continue** and backdrop tap
  call `dismissTierUp()`.
- Honors `prefers-reduced-motion`.

### Copy (`src/app/i18n.jsx`)

Add a `tierUp` block to both `nl` and `en` locales:

- `title: (tierName) => ...` — NL "Je bent gegroeid naar {tierName}!" / EN "You've grown to {tierName}!"
  The tier name is the localized name from the existing `tiers` data (`name` / `nameEn`).
- `multiplierNow: (mult) => ...` — NL "Je multiplier is nu {mult}×" / EN "Your multiplier is now {mult}×".
  Value comes from `TIER_MULTIPLIERS[to]`, formatted with the locale (NL uses comma decimals,
  e.g. "1,5").
- `continue: ...` — button label ("Doorgaan" / "Continue").

The component resolves the localized tier name from `R.tiers` using the `to` key.

## Files touched

| File | Change |
| --- | --- |
| `src/app/store/types.ts` | add `pendingTierUp` to `RRState`; add `DISMISS_TIER_UP` to `RRAction` |
| `src/app/store/initialState.ts` | initialize `pendingTierUp: null` |
| `src/app/store/reducer.ts` | `tierUpFor` helper; set `pendingTierUp` in APPLY_TRIGGER + weekend paths; `DISMISS_TIER_UP` handler |
| `src/app/store/RRContext.tsx` | expose `dismissTierUp()` |
| `src/app/i18n.jsx` | `tierUp` copy block (nl + en) |
| `src/app/app.jsx` | render `<TierUpCelebration/>` in the shell |
| `src/app/TierUpCelebration.jsx` (new) | overlay component + scoped CSS, growth + grove animation |

## Testing

Extend `src/app/store/__tests__/reducer.test.ts`:

- `pendingTierUp` is set to `{ from:'seed', to:'tree' }` when an APPLY_TRIGGER earning crosses
  the 2500 threshold from seed.
- `pendingTierUp` is set to `{ from:'tree', to:'forest' }` when crossing the 6000 threshold.
- `pendingTierUp` stays `null` for an earning that does not change tier.
- `pendingTierUp` stays `null` after `APPLY_ONBOARDING`, even when onboarding places the
  customer in tree/forest.
- `DISMISS_TIER_UP` clears `pendingTierUp` back to `null`.
- A weekend reward (SET_USAGE path) that crosses a threshold sets `pendingTierUp`.

(Vitest is configured; run with the existing test command.)

## Out of scope (YAGNI)

- Sound effects.
- Auto-dismiss / timed fade-out (explicitly chose tap-to-continue).
- Celebrating onboarding placement.
- Animating the Tiers-screen cards in place (the full-screen takeover is the chosen surface).
- Any change to tier thresholds, multipliers, or the no-demotion rule.
