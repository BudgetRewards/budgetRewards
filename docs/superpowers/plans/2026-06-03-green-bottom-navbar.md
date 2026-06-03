# Green Bottom Navbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the bottom tab bar green with white icons and text, active tab solid white and inactive tabs dimmed.

**Architecture:** Pure CSS change in `src/app/styles.css` plus one inline style value in `src/app/app.jsx`. Icons inherit text colour via `stroke="currentColor"`, so colour edits cascade to icons automatically. No structural/JSX changes. Active/inactive distinction moves from colour (grey vs green) to opacity (55% vs 100% white).

**Tech Stack:** Vite + React 19 + TypeScript, plain CSS (no preprocessor). No automated test suite — verification is manual via dev server and `npm run build`.

---

### Task 1: Green tab bar background and divider

**Files:**
- Modify: `src/app/styles.css:92-98` (`.rr-tabbar`)

- [ ] **Step 1: Edit `.rr-tabbar`**

Replace the existing block:

```css
.rr-tabbar{
  display:flex; align-items:stretch; justify-content:space-around;
  background:rgba(255,255,255,0.92);
  backdrop-filter:blur(18px) saturate(180%);
  -webkit-backdrop-filter:blur(18px) saturate(180%);
  border-top:1px solid var(--grey-line);
  padding:8px 6px 30px;
}
```

with:

```css
.rr-tabbar{
  display:flex; align-items:stretch; justify-content:space-around;
  background:var(--green);
  border-top:1px solid rgba(255,255,255,0.18);
  padding:8px 6px 30px;
}
```

(Solid green fill, blur removed, light translucent top divider.)

- [ ] **Step 2: Verify in browser**

Run: `npm run dev`
Open http://localhost:5173, look at bottom bar.
Expected: bar background is solid green (`#00A651`); no blur; thin light line across the top.

---

### Task 2: White tab colours (active solid, inactive dimmed)

**Files:**
- Modify: `src/app/styles.css:100-103` (`.rr-tab` and `.rr-tab.active`)

- [ ] **Step 1: Edit `.rr-tab` inactive colour**

Change line 101 from:

```css
  display:flex; flex-direction:column; align-items:center; gap:4px; padding:4px 0; color:var(--grey-2); }
```

to:

```css
  display:flex; flex-direction:column; align-items:center; gap:4px; padding:4px 0; color:rgba(255,255,255,0.55); }
```

- [ ] **Step 2: Edit `.rr-tab.active` colour**

Change line 103 from:

```css
.rr-tab.active{ color:var(--green); }
```

to:

```css
.rr-tab.active{ color:var(--white); }
```

- [ ] **Step 3: Verify in browser**

With dev server running, click between tabs.
Expected: active tab icon + label solid white; inactive tabs visibly dimmed (55% white) but still readable. Icons match their label colour (they use `stroke="currentColor"`).

---

### Task 3: Fix active home icon tint

**Files:**
- Modify: `src/app/app.jsx:31`

- [ ] **Step 1: Edit the active home icon fill**

Change line 31 from:

```jsx
              fill={on && (tab.id==='home') ? 'rgba(0,166,81,0.12)' : 'none'}/>
```

to:

```jsx
              fill={on && (tab.id==='home') ? 'rgba(255,255,255,0.18)' : 'none'}/>
```

(The old green tint is invisible on a green bar; a soft white tint reads correctly.)

- [ ] **Step 2: Verify in browser**

With dev server running, select the Home tab.
Expected: home icon shows a soft white fill glow inside the white stroke — not invisible, not harsh.

---

### Task 4: Build check and commit

**Files:**
- None (verification + commit)

- [ ] **Step 1: Type-check and bundle**

Run: `npm run build`
Expected: PASS — `tsc -b` reports no errors, Vite writes `dist/`.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no new errors introduced by the changed files.

- [ ] **Step 3: Commit**

```bash
git add src/app/styles.css src/app/app.jsx
git commit -m "Make bottom navbar green with white icons and text"
```

---

## Notes

- Reference spec: `docs/superpowers/specs/2026-06-03-green-bottom-navbar-design.md`.
- Tasks are tiny and sequential; each leaves the app in a working state. Tasks 1–3 can be done together then verified, but committing once at Task 4 keeps the change atomic since it is a single visual feature.
