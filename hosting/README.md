# Enduro Computer
A webapp for creating Time Keeping Enduro JART roll charts and Route Sheets.[Trello](https://trello.com/b/aooHnWXu/enduro-computer) for current task list.


## Development Environment
Now uses VSCode docker containers, very easy to setup, just open the project in VSCode, start the container then run via `npm i` and `npm start`.  There are 3 containers, Mongo (database), Redis (session state) and the root Node container.  The beauty here is you don't need to pollute your local system as everything runs inside Docker.  Well not entirely, Cypress needs to run in your local environment as I haven't figured out how to get it hosted in the docker container yet.  You can via an X server but no worries.

## Testing 
**Unit Tests**
The route sheet generation code is covered by some decent unit tests but there's always room for improvement.
``` sh
# In container
npm run test:unit
```

### Cypress Functional /End to End Testing
Cypress itself runs on your host system, opening a local browser that uses your local file system
to load test files that it runs against the URL of your app server.  This means you must first 
start up your server in whatever configuration you want (with or without coverage)

``` sh
# Container: In Node App container, Run Server with Coverage or without 
npm run server:start:coverage
npm run start
```

Now that you have the server running you have two choices for how you run Cypress.  First is using
their UI so you can watch tests, debug, etc.  Second is the automated run that is invoked when
you run `npm run test:e2e`.  In either case if you run into errors starting it just do an `npm i` 
and `npx cypress install` to make sure it's up to date. Do this on your Host machine, not inside
the container.  Here are examples of how to get it running.

**Cypress UI**
``` sh
npm i
npx cypress install 
npx browserslist@latest --update-db
npx cypress open
```
**Automated Cypress Run**
``` sh
npm i
npx browserslist@latest --update-db
npm run test:e2e
```

## Pushing Code
```bash
# Inside the Docker container
npm ci 
npm run test:unit
heroku local

# Run on your local environemnt
npm ci
npx browserslist@latest --update-db
npm run test:e2e

# Once tests pass successfully, watch the heroku logs
# for failures in a separate window and push to
# heroku.  After a successful deploy push to origin.
heroku logs --tail

git push heroku main
git push origin main

```
## Cloudflare & DNS
On 2022-02-04 we switched to full SSL.  I did this by switching DNS from Gandi to Cloudflare DNS, paying for a Hobby Dyno on Heroku, adding endurorollchart.com as a custom Heroku domain and turning on Heroku ACM.  It was easy and magic and just works, so cool.

## MongoDB
We are now hosting at [mongodb](https://cloud.mongodb.com/).  The production database name is now `enduro_prod`.  Backups are run manually and stored in `./endurojs_backup` using the dump command below.

### Backup and Restore
Use mongodump and mongorestore to backup and restore.  See [MongoDump Examples](https://docs.mongodb.com/database-tools/mongodump/#mongodump-examples) for more help.

#### Production
```bash
# Install Mongo Dump
brew tap mongodb/brew
brew install mongodb-database-tools

# Backup (run local)
EXPORT_DATE=$(date '+%Y%m%d_%H%M%S')
mkdir ../endurojs_backups/${EXPORT_DATE}
mongodump --uri="$(heroku config:get MONGODB_URI)" --archive="${EXPORT_DATE}_enduro_prod"
mv ${EXPORT_DATE}_enduro_prod ../endurojs_backups/${EXPORT_DATE}
```
#### Local
```bash
# Backup (run from inside container)
mongodump --host=db --archive="enduro.backup" --db=enduro

# Restore
mongorestore --host db --archive="enduro.backup" --drop

# Restore from Production Backup
mongorestore --host db --archive="YYYYMMDDxxxbackup" --nsFrom='enduro_prod.*' --nsTo='enduro.*' --drop
```

# Notes

## 2023/10 - Firebase Port
- Cypress
  - v9 [won't run](https://github.com/cypress-io/cypress/issues/19712), error, had to downgrade to Node 16.16.0 (LTS)
  - ES Modules - plugins/index.js wouldn't load, renamed index.ts
- Mocha - Issues with ES Modules
  - Can't load ESM Module, needed to use experimental node loader in [.mocharc.js](https://gist.github.com/jordansexton/2a0c3c360aa700cc9528e89620e82c3d), also see [this doc](https://github.com/TypeStrong/ts-node/issues/1007), and this note from [Mocha Docs](https://typestrong.org/ts-node/docs/recipes/mocha/).
  - __dirname not found, [used this hack instead](https://flaviocopes.com/fix-dirname-not-defined-es-module-scope/)

## 2021/06
Started work again to modernize the app with TypeScript, Cypress.io, proper mocha tests, Node 16 (Current) and the latest heroku stack.  After that I would like to clean up the UI using Vue or React.  Then I would like to expand the data model to include things like the club name, race date, location, links to flyers, registration, etc.  Then I will market it to clubs.

## 2020/07/25
Bumped to get latest Heroku node stack.

## 2016/05/15
The goal of this project is to build a single page web app that will take a basic enduro route sheet, a simple list of distance based actions, and generate both a printable JART chart and a detailed route sheet with all time and distance data.  It will also show you errors in your route sheet.

Secondary will be to host it somewhere and allow users to save their charts and thus share them with others before races.

## Observations
Enduro Roll Chart 3.1 and RollChartJS have some differences.
- Resets - ERC calculates Start Time for each reset relative to the previous reset.  This can incur rounding errors (see 03gmer.rs).  RCJS computes start times based on distance to the last speed change which is more accurate IMHO.
