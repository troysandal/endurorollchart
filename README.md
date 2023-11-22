# Enduro Roll Charts
A web app for creating Time Keeping Enduro Route Sheets and JART roll charts.  The app uses Firebase as it's hosting environment and Vite for builds. There is only only Firebase project which we use for Production, all local development uses Firebase emulators.   There are 3 top level folders, `hosting` contains the main web app.

- `/` - Firebase project, use to deploy firestore rules and indexes.
- `/hosting` - Web app, majority of code is here.
- `/migration` - Temporary, for migrating old database.
- `rulesTests` - Tests for firebase rules. // TODO - consider merging into hosting

# Development Setup
## Firebase Emulator
To get started you'll want to [install the Firebase emulators](https://firebase.google.com/docs/emulator-suite/install_and_configure) if you haven't already. Follow the instructions to install the correct versions of Java and Node (ERC requires Node 20 LTS) for your platform then stop there as the rest of the setup is in projects' `package.json` files. 

## First Time Setup
``` sh
# First time only, install all NPM depenedencies including Firebase tooling
npm i

cd rulesTests
npm i

cd ../hosting
npm i

# Start the Firebase App
npm firebase

# Once started open http://localhost:5000
```

## Web App
All UI development happens in the `hosting` folder.  The HTML pages are in `/src/pages` and are built with Handlebars.  The app still uses jQuery in places but I have been migrating slowly to Vanilla JS for the entire app so expect a mix of syntax.  Bootstrap is used for styling.


## Testing 
There are 3 different sets of tests, unit tests for the route sheet code, Cypress end-to-end tests and unit tests for Firestore rules. 

``` sh
# Unit Test the Firestore rules
cd rulesTests
npm run test

# Unit Test the core route sheet and JART generation.
cd hosting
npm run test:unit

# E2E Test UI via Cypress
cd hosting
npm run firebase
npm run test:e2e  # need to run in a different terminal
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

# Once tests pass successfully, push to Firebase
npm run delpoy

# Optionally push to GitHub
git push origin main

```

### Backup and Restore
Backup is via the Backup action in `/admin.html`.  You have to do it manually whenever you want.  Lame but works for now.

## Observations
Enduro Roll Chart 3.1 and Enduro Roll Chart have one difference.
- **Resets** - ERC calculates Start Time for each reset relative to the previous reset.  This can incur rounding errors (see 03gmer.rs).  ERC computes start times based on distance to the last speed change which is more accurate IMHO.

# Notes

## 2023/10 - Firebase Port
- Cypress
  - v9 [won't run](https://github.com/cypress-io/cypress/issues/19712), error, had to downgrade to Node 16.16.0 (LTS)
  - ES Modules - plugins/index.js wouldn't load, renamed index.ts
- Mocha - Issues with ES Modules
  - Can't load ESM Module, needed to use experimental node loader in [.mocharc.js](https://gist.github.com/jordansexton/2a0c3c360aa700cc9528e89620e82c3d), also see [this doc](https://github.com/TypeStrong/ts-node/issues/1007), and this note from [Mocha Docs](https://typestrong.org/ts-node/docs/recipes/mocha/).
  - __dirname not found, [used this hack instead](https://flaviocopes.com/fix-dirname-not-defined-es-module-scope/)

## 2022-02-04 Cloudflare & DNS
On 2022-02-04 we switched to full SSL.  I did this by switching DNS from Gandi to Cloudflare DNS, paying for a Hobby Dyno on Heroku, adding endurorollchart.com as a custom Heroku domain and turning on Heroku ACM.  It was easy and magic and just works, so cool.

