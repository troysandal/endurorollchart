import {
  GoogleAuthProvider,
  getAdditionalUserInfo,
  sendSignInLinkToEmail,
  signInWithPopup
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { getFirebase } from '../firebase'

// https://firebase.google.com/docs/auth/web/email-link-auth

document.getElementById('signInForm')?.addEventListener('submit', signIn)
document.getElementById('googleSignIn')?.addEventListener('click', signInWithGoogle)

async function signIn(event: Event) {
  event.preventDefault()

  const field = document.getElementsByName('email')[0] as HTMLFormElement
  const email = field.value.trim()

  function getBaseURL() {
    return `${window.location.protocol}//${window.location.host}`
  }

  const actionCodeSettings = {
    // URL you want to redirect back to. The domain (www.example.com) for this
    // URL must be in the authorized domains list in the Firebase Console.
    url: `${getBaseURL()}/emailVerify.html`,
    // This must be true.
    handleCodeInApp: true
  };

  const { auth } = getFirebase()
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings)
    window.localStorage.setItem('emailForSignIn', email)
    alert(
      `We emailed you a sign in link. Click the link in the email to sign in.
      Make sure to check your Spam folder.`
    )
  } catch (error) {
      console.log(error)
  }

  return false
}

async function signInWithGoogle() {
  const { auth, firestore } = getFirebase()
  try {
    const result = await signInWithPopup(auth, new GoogleAuthProvider())
    console.log(`logged in user ${result.user.uid}`)

    if (getAdditionalUserInfo(result)?.isNewUser) {
      const userName = result.user.displayName
        ?? result.user.email?.split('@')[0]
        ?? 'Anonymous Rider'
      await setDoc(doc(firestore, 'users', result.user.uid), { userName })
    }
    window.location.href = '/user.html'
  } catch (error) {
    console.error(error)
  }
}
