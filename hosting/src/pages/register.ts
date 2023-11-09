import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirebase } from "../firebase";
import { collection, doc, getCountFromServer, query, setDoc, where } from "firebase/firestore";

function getFormFieldValue(name: string) {
  const field = document.getElementsByName(name)[0] as HTMLFormElement
  return field.value.trim()
}

function validUserName(userName) {
  return userName.length >= 1
}

function validPassword(password) {
  return password.length >= 8
}

async function signUp(e: Event) {
  e.preventDefault()

  const userName = getFormFieldValue('username')
  const email = getFormFieldValue('email')
  const password = getFormFieldValue('password')

  if (!validUserName(userName)) {
    alert('Invalid username.')
    return false
  }

  if (!validPassword(password)) {
    alert('Invalid password.')
    return false
  }

  if (await userNameAlreadyExists(userName)) {
    alert('Username already in use.')
    return false
  }

  try { 
    await registerUser(userName, email, password)
    window.location.pathname = "/user.html"
  } catch (error: any) {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log(`${errorCode} - ${errorMessage}`)

    alert('Unable to register you, please try different credentials.')
  }

  return false
}

async function userNameAlreadyExists(userName: string) {
  const { firestore } = getFirebase()
  const q = query(collection(firestore, "users"), where("userName", "==", userName))
  const querySnapshot = await getCountFromServer(q)
  return querySnapshot.data.length > 0
}

// TODO - Ensure email & displayName are valid (length, unique)
// TODO - Update profile with displayname (for future use)

document.getElementById('registerForm')?.addEventListener('submit', signUp)

async function registerUser(userName: string, email: string, password: string) {
  const auth = getAuth();
  const { firestore } = getFirebase()

  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user;
  console.log(user)
  await updateProfile(user, {displayName: userName})
  await setDoc(doc(firestore, 'users', user.uid), {
    userName
  })
}