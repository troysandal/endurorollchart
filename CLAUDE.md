# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Enduro Roll Charts: a web app for building Time Keeping Enduro route sheets and JART roll charts. Firebase (Firestore, Auth, Hosting) backend, Vite + Handlebars + TypeScript frontend (mixed jQuery/vanilla JS, Bootstrap styling). Requires Node 24 LTS (`>=24.12 <25`, `.nvmrc`); Node 25+ breaks `npx firebase` because a transitive dependency (`buffer-equal-constant-time`) uses the removed `SlowBuffer`. There is a single Firebase project (production); all local development uses the Firebase emulators.

## Layout

- `/` – Firebase project: `firestore.rules`, `firestore.indexes.json`, `firebase.json` (emulator ports: auth 9099, firestore 8080, hosting 5000).
- `web/` – the web app; almost all code lives here, including all three kinds of tests (unit in `test/specs`, Firestore rules in `test/rules`, Cypress in `cypress/`). `web` is the only npm package (there is no root `package.json`); run every npm/npx command from there, and the Firebase CLI finds `../firebase.json` by itself.

Firebase CLI is not installed globally; use `npx firebase` from `web`.

## Commands

All from `web/` unless noted.

```sh
npm run dev            # alias of `npm run firebase`: starts auth/firestore/hosting emulators (Vite build via firebase frameworks), http://localhost:5000
npm run build          # tsc && vite build --mode development
npm run test:unit      # mocha: test/specs/test.*.ts (route sheet logic, no emulator needed)
npm run test:rules     # mocha --config .mocharc.rules.cjs: test/rules/test.*.ts (Firestore rules; needs emulators running)
npm run test:e2e       # cypress run (needs emulators running in another terminal)
npm test               # unit + rules + e2e
npx mocha -g "name"    # single unit test by title; or: npx mocha test/specs/test.jart.ts
npx mocha --config .mocharc.rules.cjs -g "name"   # single rules test by title
npx cypress run --spec cypress/e2e/jart.cy.ts   # single e2e spec
npx cypress open       # Cypress UI

npm run deploy:hosting           # firebase deploy --only hosting
npm run deploy:firestore         # firebase deploy --only firestore (rules + indexes)
```

Notes:
- Use `localhost`, not `127.0.0.1` (Google sign-in fails on the latter).
- If the emulator fails with "HTTP Error: 401 ... invalid authentication credentials", run `npx firebase logout` then `npx firebase login`.
- `npm run firebase` imports `./offline-seed` and exports on exit.
- Mocha runs TypeScript through `tsx` (`node-option: import=tsx` in `web/.mocharc.cjs` for unit tests and `web/.mocharc.rules.cjs` for rules tests; `--config` replaces the default config rather than merging). The package is `"type": "module"` (Chai 6 is ESM-only); `__dirname` is unavailable in ES modules. The rules test reads `../firestore.rules`, so run it from `web/`. The rules tests call `clearFirestore()`, which wipes the emulator's Firestore data (run order: unit, rules, e2e).
- `npm run test:e2e` uses `cypress run --browser chrome` (Electron is deprecated in Cypress 16), so Chrome must be installed. Cypress 16 removed `Cypress.env()`: use `cy.env([...])` (see `cypress/support/commands.ts`).
- The emulators need the `webframeworks` experiment (`npx firebase experiments:enable webframeworks`, once per machine).
- If `.firebase/<site>/hosting` exists (left behind by `firebase deploy`) the hosting emulator serves that stale production build statically with clean URLs instead of the Vite dev server, and `/x.html` gets a 301 to `/x`. The `firebase`/`dev` npm scripts delete it before starting the emulators (`rm -rf ../.firebase/*/hosting`); keep that prefix, and if you launch the emulators another way, delete the folder first.
- `tsconfig.json` sets `"types": ["jquery"]` (TypeScript 7 no longer auto-loads every `@types/*`); the app code is browser code, so don't add `node` types to it.
- There is deliberately no bare `deploy` script, so hosting and Firestore deploys are always explicit. `.nvmrc` stays at the repo root; nvm finds it from `web/`.

## Architecture

**Pages**: each HTML page is a Handlebars template `src/pages/<name>.hbs` paired with a `src/pages/<name>.ts` script (e.g. `enduro.hbs`/`enduro.ts`, `jart.hbs`/`jart.ts`, `admin`, `user`, `login`, `import`). Layouts are in `src/layouts/`; `layout_jart.hbs` intentionally omits Bootstrap because Bootstrap's print CSS overrides backgrounds and breaks colored JART printing. Keep Bootstrap out of that layout.

**Firebase access**: `src/firebase.ts` (`getFirebase()`) initializes app/auth/firestore and connects to emulators; `src/config.ts` holds the config and `useEmulator`. Under Cypress it forces Firestore long polling.

**Timekeeping domain core** (`src/timekeeping/`, framework-free, covered by the Mocha unit tests):
- `actions.ts` – route sheet `Action` classes (SpeedChange, Reset, ResetTo0, FreeTime, FreeZone, GasStop, Known, Note, Start, End) and the `ActionType` enum. The enum string values are persisted in the JSON format and used as CSS class names: never rename them. Mileage is stored in tenths (integer math) and time as seconds since race start, so changing key time needs no recalculation of the actions.
- `routesheet.ts` – `RouteSheet`, an ordered list of actions that computes times; emits `recalc` events via `EventDispatcher` (`util.ts`).
- `possibles.ts` – "possible" mileage calculations.
- `jart.ts` – turns an `Enduro` into JART rows (actions plus `isPossible` rows), generated in two passes.
- `enduro.ts` – the enduro model (route sheet plus metadata such as title and lap info).
- `serializeRS.ts` / `serializeJSON.ts` – the two file formats. RS is a line-oriented text format (see `web/RSFILE.md`; 15 actions, `#` comments, lap implicit via `reset_0`). JSON has versions (fixtures `route.v1.json`, `route.v2.json`).

Start times for resets are computed from distance to the last speed change, not relative to the previous reset as the legacy Windows Enduro Rollchart app does. This is an intentional difference, so outputs may differ slightly from the Windows app.

**Tests**: unit-test fixtures (`.rs`, `.json`, and expected `_Route_Sheet.txt`/`_Roll_Chart.txt` outputs generated by the Windows app) are in `web/test/routesheets/`. Cypress e2e specs are in `web/cypress/e2e/`, with fixtures in `cypress/fixtures`.

**Backup**: manual, via the Backup action on `/admin.html`.
