# Green Bottom Navbar — Design

**Date:** 2026-06-03
**Status:** Approved

## Goal

Make the bottom tab bar green, with icons and text white. Green matches the
existing brand greens already used in the app.

## Current behaviour

- `.rr-tabbar` (`src/app/styles.css`): translucent white background
  (`rgba(255,255,255,0.92)`) with `backdrop-filter` blur and a grey top border.
- `.rr-tab`: inactive tabs use `var(--grey-2)`; active tab uses `var(--green)`.
- Icons inherit tab colour via `stroke="currentColor"` (`src/app/app.jsx` line 30),
  so text and icon always share one colour.
- Active "home" icon has a hardcoded green tint fill `rgba(0,166,81,0.12)`
  (`src/app/app.jsx` line 31).

## Design decisions

| Decision | Choice |
|----------|--------|
| Bar background | `var(--green)` (`#00A651`, primary brand green) |
| Active tab | Solid white icon + text (`var(--white)`) |
| Inactive tab | White at 55% opacity (`rgba(255,255,255,0.55)`) |
| Top divider | `rgba(255,255,255,0.18)` (subtle light line) |
| Backdrop blur | Removed (no effect over a solid fill) |

Active/inactive distinction shifts from colour (grey vs green) to opacity
(55% vs 100% white), since both now sit on a green background.

## Changes

### `src/app/styles.css`

1. `.rr-tabbar`
   - `background`: `rgba(255,255,255,0.92)` → `var(--green)`
   - remove `backdrop-filter` and `-webkit-backdrop-filter`
   - `border-top`: `1px solid var(--grey-line)` → `1px solid rgba(255,255,255,0.18)`
2. `.rr-tab`
   - `color`: `var(--grey-2)` → `rgba(255,255,255,0.55)`
3. `.rr-tab.active`
   - `color`: `var(--green)` → `var(--white)`

### `src/app/app.jsx` (line 31)

- Active home icon `fill`: `rgba(0,166,81,0.12)` → `rgba(255,255,255,0.18)`
  (green tint is invisible on a green bar; switch to a white tint).

## Out of scope

- No JSX structure changes — icon colour follows text via `currentColor`.
- No change to other screens, cards, buttons, or design tokens.
- No active-tab pill, lime accent, or underline (rejected in favour of opacity).

## Verification

- `npm run dev`, open app, inspect bottom bar: green background, white active
  tab, dimmed inactive tabs, readable labels.
- Check active "home" icon tint reads as a soft white glow, not invisible.
- `npm run build` passes (tsc + bundle).
