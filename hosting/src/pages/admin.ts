import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { getFirebase } from '../firebase'
import { Timestamp, addDoc, collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { fromJSON, toJSON } from '../timekeeping/serializeJSON'

const { auth, firestore } = getFirebase()

document.getElementById('publishAll')?.addEventListener('click', async () => {
  const q = query(collection(firestore, "enduros"))
  const snapshot = await getDocs(q)

  const rows = snapshot.docs.map((doc) => {
    return { id: doc.id, ...doc.data() }
  })

  for (let row of rows) {
    await updateDoc(doc(firestore, "enduros", row.id), {
      updatedAt: serverTimestamp(),
      isPublished: true,
    });  
  }
})

document.getElementById('export')?.addEventListener('click', async () => {
  const data = {
    enduros: {},
    users: {},
  }
  async function getCollection(name) {
    let q = query(collection(firestore, name))
    let snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => {
      return { id: doc.id, ...doc.data() }
    })
  }
  data.enduros = await getCollection('enduros')
  data.users = await getCollection('users')

  const blob = new Blob([JSON.stringify(data)], {type: "application/json;charset=utf-8"});
  saveAs(blob, 'export.json')
})

function saveAs(blob: Blob, fileName: string) {
  const link = document.createElement("a");
  link.download = fileName
  link.href = URL.createObjectURL(blob);
  link.click();
}


document.getElementById('migrate')?.addEventListener('click', migrate)


async function migrate() {

  // Load DB
  const response = await fetch('/db.json')
  const db = await response.json()

  // Do the admin's first
  for (let user of db.users) {
    if (user.username !== 'troysandal@gmail.com') {
      continue
    }
    console.log('---> troysandal@gmail.com <---')
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
      console.log('\n')
      console.log(`---> ${user.username} <---`)
      user.uid = await createUser(
        user.username, 
        user.username.split('@')[0], 
        Math.round(Math.random() * 10000000000000).toString())
      db.usersMap[user.id].entry.uid = user.uid
      await createEndurosForUser(db, user.uid)
    }
  }

  // Create anonymous enduros
  const anonymousUid = await createUser(
    'troy@photagonist.com',
    'Enduro Rider',
    Math.round(Math.random() * 10000000000000).toString()
  )
  console.log(`Anon uid = ${anonymousUid}`)

  for (let user of db.users) {
    const isEmail = user.username.indexOf('@') != -1

    if (!isEmail) {
      user.uid = anonymousUid
      db.usersMap[user.id].entry.uid = user.uid
    }
  }
  console.log('\n')
  console.log('---> troy@photagonist.com <---')
  await createEndurosForUser(db, anonymousUid)
}

async function createEndurosForUser(db, uid: string) {
  const routes = db.routes.filter((route) => {
    return db.usersMap[route.user.$oid].entry?.uid === uid
  })

  for (let route of routes) {
    const createdAtDate = new Date(route.createdAt.$date)
    const updatedAtDate = new Date(route.updatedAt.$date)

    const enduro = fromJSON(route)
    const json = toJSON(enduro)

    const newDoc = {
      userId: uid,
      createdAt: Timestamp.fromDate(createdAtDate),
      updatedAt: Timestamp.fromDate(updatedAtDate),
      isPublished: true,
      ...json
    }
    console.log(`Created ${newDoc.title}`)
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
    signInWithEmailAndPassword(auth, email, password)
    console.log(`user ${userName} already created as ${uid}`)
  }

  return uid
}
