# Enduro Roll Charts
A web app for creating Time Keeping Enduro Route Sheets and JART roll charts.  

## About the App & Repository
The app uses Firebase Firestore for data, Hosting for web site and Vite for builds. There is only one Firebase project, which we use for Production, all local development uses Firebase emulators.   `web` contains the main web app.

- `/` - Firebase project, use to deploy firestore rules and indexes.
- `/web` - Web app, majority of code is here, including the unit, Firestore rules (`test/rules`) and Cypress tests.

# Development Setup
## NodeJS
We require **Node 24 LTS** (`>=24.12 <25`, see `.nvmrc`). Run `nvm install` then `nvm use` in the repo root to install and use it. Don't use `nvm install --lts`, which now installs Node 26. 

**Why not Node 25+?** Node 25 removed `SlowBuffer`, and `buffer-equal-constant-time` (a transitive dependency of `firebase-tools` and `firebase-admin` via `jws`/`jwa`) still uses it, so `npx firebase` crashes on startup. Revisit when `jwa` drops that dependency; until then the `engines` field fails installs on newer Node.
## Firebase Emulator
To get started you'll want to [install the Firebase emulators](https://firebase.google.com/docs/emulator-suite/install_and_configure) if you haven't already. Follow the instructions to install the correct versions of Java and Node (ERC requires Node 24 LTS) for your platform then stop there as the rest of the setup of emulators is complete - see `/firebase.json`. **NOTE** - we don't install the Firebase CLI (firebase-tools) globally, it's instead accessed from `web` via `npx firebase`. 

## First Time Setup
``` sh
# First time only, install all NPM dependencies including Firebase tooling
cd web
npm i

# Start the Firebase App
npx firebase experiments:enable webframeworks
npm run firebase

# OPTIONAL - If firebase won't start and says something like "HTTP Error: 401, Request had invalid authentication credentials." then you need to logout and login
npx firebase logout
npx firebase login

# Once started open http://localhost:5000
# NOTE - You can't use Google sign-in via 127.0.0.1, use localhost
open http://localhost:5000
```

## Web App
All UI development happens in the `web` folder.  The HTML pages are in `/src/pages` and are built with Handlebars.  The app still uses jQuery in places but I have been migrating slowly to Vanilla JS for the entire app so expect a mix of syntax.  Bootstrap is used for styling.


## Testing 
There are 3 different sets of tests, all run from `web`: unit tests for the route sheet code, unit tests for Firestore rules and Cypress end-to-end tests. The rules and end-to-end tests need the emulators running.

``` sh
cd web
npm run firebase       # if not already running, run in separate terminal
npm run test           # test:unit && test:rules && test:e2e

npm run test:unit      # route sheet code, no emulator needed
npm run test:rules     # Firestore rules (test/rules), needs emulators
npm run test:e2e       # Cypress, needs emulators
```

### Cypress Manual Testing
`npm run test:e2e` runs Cypress in Chrome (`--browser chrome`) because Cypress 16 deprecated its bundled Electron browser, so Chrome must be installed.

The Firebase emulators need the web frameworks experiment enabled once per machine: `npx firebase experiments:enable webframeworks`.

When developing new Cypress tests or debugging existing ones use the Cypress UI via `npx cypress open`.  If you run into errors starting it just do an `npm i` and `npx cypress install` to make sure it's up to date. Here are examples of how to get it running.

**Cypress UI**
``` bash
npm i
npx cypress install 

# optional, use only if Cypress says to do it
npx browserslist@latest --update-db

npx cypress open
```

## Pushing Code
```bash
# Start Firebase
cd web
npm ci
npm run dev

# (in separate terminal) Run unit, Firestore rules and Cypress tests
cd web
npm run test

# optional, use only if Cypress says to do it
npx browserslist@latest --update-db

# Once tests pass successfully, push to Hosting Firebase
npm run deploy:hosting

# [optional] Deploy Firestore Rules & Indexes ... if changed, not common
npm run deploy:firestore
```

### Backup and Restore
Backup is via the Backup action in `/admin.html`.  You have to do it manually whenever you want.  Lame but works for now.

## Observations
The Windows Enduro Rollchart 3.1 app and this app have one difference.
- **Resets** - The Windows Enduro Rollchart app calculates Start Time for each reset relative to the previous reset.  This can incur rounding errors (see 03gmer.rs).  This codebase computes start times based on distance to the last speed change which is more accurate IMHO.

# Work Notes

## 2026-11-11 - Update all npm packages

In preparation for some work, I'm updating all our packages to be modern.

* Pinned Node 24 LTS (`.nvmrc`, `engines`); Node 25+ breaks `npx firebase` (see above).
* Updated Cypress 16, Vite 8, TypeScript 7, Firebase 13, firebase-tools 15 and firebase-admin 14.
* Merged the root package and the rules tests into a single npm package, now in `web`.
* Replaced `chai-as-promised` with `assertFails` / `assertSucceeds` from `@firebase/rules-unit-testing`.

## 2024-10-19 - JARTs not printing in color

I woke up trying to print a JART for tomorrow's race and found it was completely in black and white.  This never happened before so after stumbling through GIT histories, assuming I did something, I opened Chrome dev tools and found that Bootstrap is globally overriding the `background` in print to white.  This [answer explains](https://stackoverflow.com/questions/33410724/bootstrap-print-css-removes-background-color) why. Two questions:

1. Why did this work until now? We used to embed the bootstrap.min.js but switched to the CDN - that must have broken it, and/or they made an update.
1. How do I fix it? Use a new `layout_jart.hbs` that doesn't include bootstrap. 

## 2024-08-20 - WIP

I've been trying to figure out how to get Vite into development mode.  Tried Passing FIREBASE_FRAMEWORKS_BUILD_TARGET='development' [see](https://stackoverflow.com/questions/77655405/firebase-hosting-web-frameworks-w-angular-selecting-environments) to firebase command but the build output shows 3 Vite build passes each in production with only the serve vite pass having development mode.  Next try - .env.local which [Vite supports](https://vitejs.dev/guide/env-and-mode)

**Outdated NPM Packages**
`firebase-admin` and `firebase-tools` were both updated and have breaking changes (see [1](https://firebase.google.com/support/release-notes/admin/node) and [2](https://github.com/firebase/firebase-tools/releases?page=5)).  I also updated all packages for critical security updates. 

TODO
* DONE - Update existing semver matches (root and) `npm update`
* DONE - Update out of semver (chai, cypress, firebase, vite)
* DONE (2026-11-11) - Do we need cypress in the root?  No. The root package was removed and everything now lives in `web`.


## 2024-08-12

**DONE Hosting Rules**
Uhh, we only have `firestore.rules`, do we need hosting rules?  What are the defaults?  Check this out. [Docs are here](https://firebase.google.com/docs/hosting/full-config), looks like by default `public` folder is shared and we're doing things fine. I 

**DONE - Build won’t run**
Tried to fire up the emulator today but `npm run firebase` gives me this - weird as this used to work before.  SOLUTION - access token was outdated, `npx firebase logout` and `npx firebase login` fixed it. Updated README

``` sh
Error: HTTP Error: 401, Request had invalid authentication credentials. Expected OAuth 2 access token, login cookie or other valid authentication credential. See https://developers.google.com/identity/sign-in/web/devconsole-project.
```

**DONE - Node v20 Upgrade**
(DONE) Dude, node 16 is so last year, need to [bump to v20 LTS](https://endoflife.date/nodejs).




## 2023/10 - Firebase Port
- Cypress
  - v9 [won't run](https://github.com/cypress-io/cypress/issues/19712), error, had to downgrade to Node 16.16.0 (LTS)
  - ES Modules - plugins/index.js wouldn't load, renamed index.ts
- Mocha - Issues with ES Modules
  - Can't load ESM Module, needed to use experimental node loader in [.mocharc.js](https://gist.github.com/jordansexton/2a0c3c360aa700cc9528e89620e82c3d), also see [this doc](https://github.com/TypeStrong/ts-node/issues/1007), and this note from [Mocha Docs](https://typestrong.org/ts-node/docs/recipes/mocha/).
  - __dirname not found, [used this hack instead](https://flaviocopes.com/fix-dirname-not-defined-es-module-scope/)

## 2022-02-04 Cloudflare & DNS
On 2022-02-04 we switched to full SSL.  I did this by switching DNS from Gandi to Cloudflare DNS, paying for a Hobby Dyno on Heroku, adding endurorollchart.com as a custom Heroku domain and turning on Heroku ACM.  It was easy and magic and just works, so cool.

