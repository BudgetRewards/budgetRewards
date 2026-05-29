# BudgetRewards Vite/React/TS Scaffold — Design Spec

**Date:** 2026-05-29  
**Status:** Approved

## Goal

Initialize `budgetRewards` as a Vite + React + TypeScript project and publish it to the `BudgetRewards` GitHub org.

## Scaffold

- Tool: `npm create vite@latest` with `react-ts` template
- Target directory: `C:\Users\k.herring\development\budgetRewards`
- No additions beyond default template output

### Output structure

```
budgetRewards/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## GitHub

| Field | Value |
|---|---|
| Org | `BudgetRewards` |
| Repo name | `budgetRewards` |
| Visibility | Public |
| Default branch | `main` |

## Steps

1. Scaffold with `npm create vite@latest . -- --template react-ts`
2. `npm install`
3. `git init && git add . && git commit`
4. `gh repo create BudgetRewards/budgetRewards --public --source=. --push`
