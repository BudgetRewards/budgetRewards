# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server at http://localhost:5173
npm run build      # type-check (tsc -b) then bundle to dist/
npm run lint       # ESLint over all .ts/.tsx files
npm run preview    # serve the last dist/ build locally
```

There is no test suite yet.

## Architecture

Vite + React 19 + TypeScript. Entry: `index.html` → `src/main.tsx` → `src/App.tsx`.

### Feature toggle: `VITE_FEATURE_LOADING_SCREEN`

`App.tsx` reads `import.meta.env.VITE_FEATURE_LOADING_SCREEN`. When `"true"`, it short-circuits and renders `<ComingSoon />` instead of the main app — the entire rest of `App.tsx` is bypassed.

Toggle is set in `.env.local` (gitignored via `*.local`). See `.env.example` for the available variables.

### ComingSoon screen (`src/ComingSoon.tsx` + `src/ComingSoon.css`)

Full-viewport coming-soon page for the BudgetRewards loyalty programme. Key implementation notes:
- All CSS is scoped under `.coming-soon-root` to prevent bleed into the main app styles.
- Countdown timer runs via `useEffect`/`useRef` (not state) to avoid re-renders every second.
- Email signup uses `useState` — `signedUp` replaces the input row with a confirmation message.
- Animation keyframe names are prefixed `cs-` to avoid collisions with global keyframes.

### GitHub org

Repo lives under the `BudgetRewards` GitHub org (`BudgetRewards/budgetRewards`), not under BudgetThuis.
