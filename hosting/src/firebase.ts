import { initializeApp, getApps } from 'firebase/app'
import {
  getFirestore,
  doc,
  getDoc,
  connectFirestoreEmulator
} from 'firebase/firestore'
import { connectAuthEmulator, getAuth, onAuthStateChanged } from 'firebase/auth'
import { config } from './config'

function initializeServices() {
  const isConfigured = getApps().length > 0
  const firebaseApp = initializeApp(config.firebase)
  const firestore = getFirestore(firebaseApp)
  const auth = getAuth(firebaseApp)
  return { firebaseApp, firestore, auth, isConfigured }
}

function connectToEmulators({ auth, firestore }) {
  if (location.hostname === 'localhost' && config.useEmulator) {
    connectFirestoreEmulator(firestore, 'localhost', 8080)
    connectAuthEmulator(auth, 'http://localhost:9099')
  }
}

export function getFirebase() {
  const services = initializeServices()
  if (!services.isConfigured) {
    connectToEmulators(services)
    //enableMultiTabIndexedDbPersistence(services.firestore);
  }
  return services
}
export function getEnduroID() {
  const params = new URLSearchParams(document.location.search);
  return params.get("id")
}


export async function getEnduro(id: string) {
    const { firestore } = getFirebase()
    const enduroRef = doc(firestore, 'enduros', id)
    const enduroSnapshot = await getDoc(enduroRef)
    if (enduroSnapshot.exists()) {
        return {
            id,
            ...enduroSnapshot.data()
        }
      } else {
        console.warn(`Enduro Not Found ${id}`);
        return null
      }
}


export function onAuth(callback) {
  const { auth } = getFirebase();
  return onAuthStateChanged(auth, user => {
    callback(user);
  })
}

