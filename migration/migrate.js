const fs = require('fs');

function fb2JSON(fileName) {
  const text = fs.readFileSync(fileName, {encoding: 'utf-8'});
  const lines = text.split('\n')
  return eval(`[${lines.join(',')}]`)
}

function readDB() {
  return {
    users: fb2JSON('users.json'),
    routes: fb2JSON('routes.json')
  }
}

const db = readDB()

function dbInfo(db) {
  console.log(`# Users - ${db.users.length}`)
  console.log(`# Routes - ${db.routes.length}`)
}

dbInfo(db)

function stripDeadEnduros(db) {
  db.routes = db.routes.filter((route) => {
    return route.title !== "New Enduro"
  })
}

console.log('Stripping dead routes')
stripDeadEnduros(db)
dbInfo(db)

function buildIdMap(collection) {
  const map = {}
  // "_id":{"$oid":"57feb340b450d31100d1efe8"}
  collection.forEach((element) => {
    element.id = element._id.$oid
    delete element._id
    delete element.salt
    delete element.hash
    delete element.__v
    map[element.id] = {
      entry: element
    }
  })
  return map
}

function fixDmitry(db) {
  // Dmitry has 2 accounts - combine them under the one with the email
  // dima2000@yahoo.com
  // dmitriy
  const email = db.users.find((user) => user.username === 'dima2000@yahoo.com')
  const uname = db.users.find((user) => user.username === 'dmitriy')

  // Change all enduros with uname to email
  const unameRoutes = db.routes.filter((route) => route.user.$oid === uname._id.$oid)
  unameRoutes.forEach((route) => route.user.$oid = email._id.$oid)
  db.users = db.users.filter((user) => user.username !== 'dmitriy')

  // Fixup Troy
  const troy = db.users.find((user) => user.username === "troy")
  troy.username = "troysandal@gmail.com"
}

console.log(`#Users ${db.users.length}`)
fixDmitry(db)
console.log(`#Users ${db.users.length}`)

db.usersMap = buildIdMap(db.users)
db.routesMap = buildIdMap(db.routes)

function mapUsers2Enduros(db) {
  // "user": {
  //   "$oid": "57feb340b450d31100d1efe8"
  // },
  for (let route of db.routes) {
    let user = db.usersMap[route.user.$oid]?.entry
    if (user === null) {
      db.usersMap['unknown'] = db.usersMap['unknown'] || {}
      user = db.usersMap['unknown']
    }
    user.enduros = user.enduros || []
    user.enduros.push(route.id)
  }
}

mapUsers2Enduros(db)

function stripDeadUsers(db) {
  db.users = db.users.filter((user) => {
    return db.usersMap[user.id].entry?.enduros?.length > 0 ?? false
  })
}

console.log('Stripping dead users')
stripDeadUsers(db)
dbInfo(db)


function dumpUserEnduros(db) {
  for (let userId of Object.keys(db.usersMap)) {
    const user = db.usersMap[userId].entry
    if (user?.enduros?.length) {
      console.log(`${user.username} - ${user?.enduros?.length ?? 0} enduros`)
    }
  }
}

dumpUserEnduros(db)

fs.writeFileSync('../hosting/public/db.json', JSON.stringify(db))
