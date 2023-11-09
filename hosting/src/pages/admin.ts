import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { getFirebase } from '../firebase'
import { Timestamp, addDoc, collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore'
import { fromJSON, toJSON } from '../timekeeping/serializeJSON'
// import { fromJSON, toJSON } from '../timekeeping/serializeJSON'

document.getElementById('migrate')?.addEventListener('click', migrate)

const { auth, firestore } = getFirebase()

async function migrate() {

  // Load DB
  const response = await fetch('/db.json')
  const db = await response.json()

  // Do the admin's first
  for (let user of db.users) {
    if (user.username !== 'troysandal@gmail.com') {
      continue
    }
    user.uid = auth.currentUser?.uid
    db.usersMap[user.id].entry.uid = user.uid
    await createEndurosForUser(db, user.uid)
    break
  }

  // Create user accounts for those with emails
  for (let user of db.users) {
    // always done first, skip
    if (user.username === 'troysandal@gmail.com') {
      continue
    }
    const isEmail = user.username.indexOf('@') != -1
    console.log(`${user.username} - ${isEmail}`)
    if (isEmail) {
      user.uid = await createUser(
        user.username, 
        user.username.split('@')[0], 
        'you.will.Never.gu3ss.this.password')
      db.usersMap[user.id].entry.uid = user.uid
      await createEndurosForUser(db, user.uid)
    }
  }

  // Create anonymous enduros
  const anonymousUid = await createUser(
    'troy@photagonist.com',
    'Enduro Rider',
    'pretty.1.Is.forage'    
  )
  console.log(`Anon uid = ${anonymousUid}`)

  for (let user of db.users) {
    const isEmail = user.username.indexOf('@') != -1
    console.log(`${user.username} - ${isEmail}`)
    if (!isEmail) {
      user.uid = anonymousUid
      db.usersMap[user.id].entry.uid = user.uid
    }
  }
  await createEndurosForUser(db, anonymousUid)
}

async function createEndurosForUser(db, uid: string) {
  const routes = db.routes.filter((route) => {
    return db.usersMap[route.user.$oid].entry?.uid === uid
  })

  for (let route of routes) {
    const createdAtDate = new Date(route.createdAt.$date)
    const updatedAtDate = new Date(route.updatedAt.$date)

    console.log(`name ${route.title}`)
    console.log(`created: ${createdAtDate}`)
    console.log(`updated: ${updatedAtDate}`)

    const enduro = fromJSON(route)
    const json = toJSON(enduro)

    const newDoc = {
      userId: uid,
      createdAt: Timestamp.fromDate(createdAtDate),
      updatedAt: Timestamp.fromDate(updatedAtDate),
      ...json
    }
    console.log(newDoc)
    console.assert(uid === auth.currentUser?.uid, `UID Wrong - ${uid} !== ${auth.currentUser?.uid}`)
    try {
      await addDoc(collection(firestore, "enduros"), newDoc);
    } catch (error) {
      console.log(error)
    }
    // console.log(`Created new enduro ${docRef.id}`)
  }  
}

async function findUserByUserName(userName: string) {
  const q = query(collection(firestore, "users"), where("userName", "==", userName))
  const querySnapshot = await getDocs(q)
  if (querySnapshot.docs.length) {
    return querySnapshot.docs[0].id
  }
  return null
}
async function createUser(email: string, userName: string, password: string) {
  let uid = await findUserByUserName(userName)

  if (uid === null) {
    console.log(`creating user ${userName} / ${email}`)
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      email,
      password
    )
    await updateProfile(userCredential.user, {displayName: userName})
    await setDoc(doc(firestore, 'users', userCredential.user.uid), {
      userName
    })
    uid = userCredential.user.uid
  } else {
    console.log(`user ${userName} already created as ${uid}`)
  }

  return uid
}
