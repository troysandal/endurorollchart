# Enduro Roll Charts
A web app for creating Time Keeping Enduro Route Sheets and JART roll charts.  

## About the App & Repository
The app uses Firebase Firestore for data, Hosting for web site and Vite for builds. There is only only Firebase project which we use for Production, all local development uses Firebase emulators.   There are 3 top level folders, `hosting` contains the main web app.

- `/` - Firebase project, use to deploy firestore rules and indexes.
- `/hosting` - Web app, majority of code is here.
- `/migration` - Temporary, for migrating old database.
- `rulesTests` - Tests for firebase rules. // TODO - consider merging into hosting

# Development Setup
## NodeJS
We require Node v20 LTS, normally using `nvm install --lts` and `node use --lts` to install and use it.
## Firebase Emulator
To get started you'll want to [install the Firebase emulators](https://firebase.google.com/docs/emulator-suite/install_and_configure) if you haven't already. Follow the instructions to install the correct versions of Java and Node (ERC requires Node 20 LTS) for your platform then stop there as the rest of the setup of emulators is complete - see `/firebase.json`. **NOTE** - we don't install the Firebase CLI (firebase-tools) globally, it's instead access from `hosting` via `npx firebase`. 

## First Time Setup
``` sh
# First time only, install all NPM depenedencies including Firebase tooling
npm i

cd rulesTests
npm i

cd ../hosting
npm i

# Start the Firebase App
npm run firebase

# OPTIONAL - If firebase won't start and says something like "HTTP Error: 401, Request had invalid authentication credentials." then you need to logout and login
npx run firebase logout [email]
npx run firebase login

# Once started open http://localhost:5000
# NOTE - You can't use Google sign-in via 127.0.0.1, use localhost
open http://localhost:5000
```

## Web App
All UI development happens in the `hosting` folder.  The HTML pages are in `/src/pages` and are built with Handlebars.  The app still uses jQuery in places but I have been migrating slowly to Vanilla JS for the entire app so expect a mix of syntax.  Bootstrap is used for styling.


## Testing 
There are 3 different sets of tests, unit tests for the route sheet code, Cypress end-to-end tests and unit tests for Firestore rules. 

``` sh
# Unit Test the Firestore rules
cd rulesTests
npm run test

# Unit & Integration Tests
cd hosting
npm run firebase  # if not already running, run in separate terminal
npm run test      # test:unit && test:e2e
```

### Cypress Manual Testing
When developing new Cypress tests or debugging existing ones use the Cypress UI via `npx cypress open`.  If you run into errors starting it just do an `npm i` 
and `npx cypress install` to make sure it's up to date. 
the container.  Here are examples of how to get it running.

**Cypress UI**
``` sh
npm i
npx cypress install 

# optional, use only if Cypress says to do it
npx browserslist@latest --update-db

npx cypress open
```

## Pushing Code
```bash
# Run unit tests
cd rulesTests
npm run test

cd ../hosting
npm ci 
npm run test:unit

# Run Cypress E2E tests
npm ci
# optional, use only if Cypress says to do it
npx browserslist@latest --update-db

npm run test:e2e

# Once tests pass successfully, push to Hosting Firebase
npm run delpoy

# Deploy Firestore Rules & Indexes
cd ..
npm run deploy

# Optionally push to GitHub
git push origin main

```

### Backup and Restore
Backup is via the Backup action in `/admin.html`.  You have to do it manually whenever you want.  Lame but works for now.

## Observations
Enduro Roll Chart 3.1 and Enduro Roll Chart have one difference.
- **Resets** - The Windows Enduro Rollchart app calculates Start Time for each reset relative to the previous reset.  This can incur rounding errors (see 03gmer.rs).  This codebase computes start times based on distance to the last speed change which is more accurate IMHO.

# Work Notes

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

**Outdated / Audit**
`firebase-admin` and `firebase-tools` are both updated and have breaking changes (see [1](https://firebase.google.com/support/release-notes/admin/node) and [2](https://github.com/firebase/firebase-tools/releases?page=5)) - also lots of critical security updated. 

TODO
* DONE - Update existing semver matches `npm update`
* Update out of semver (chair, cypress, firebase, vite)
* Do we need cypress in the root?  Prolly not, and what about firebase? 

? Do we need to tackle this now?


## 2023/10 - Firebase Port
- Cypress
  - v9 [won't run](https://github.com/cypress-io/cypress/issues/19712), error, had to downgrade to Node 16.16.0 (LTS)
  - ES Modules - plugins/index.js wouldn't load, renamed index.ts
- Mocha - Issues with ES Modules
  - Can't load ESM Module, needed to use experimental node loader in [.mocharc.js](https://gist.github.com/jordansexton/2a0c3c360aa700cc9528e89620e82c3d), also see [this doc](https://github.com/TypeStrong/ts-node/issues/1007), and this note from [Mocha Docs](https://typestrong.org/ts-node/docs/recipes/mocha/).
  - __dirname not found, [used this hack instead](https://flaviocopes.com/fix-dirname-not-defined-es-module-scope/)

## 2022-02-04 Cloudflare & DNS
On 2022-02-04 we switched to full SSL.  I did this by switching DNS from Gandi to Cloudflare DNS, paying for a Hobby Dyno on Heroku, adding endurorollchart.com as a custom Heroku domain and turning on Heroku ACM.  It was easy and magic and just works, so cool.

