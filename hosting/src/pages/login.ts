import firebase from 'firebase/compat/app'
import "firebase/compat/firestore";
import "firebase/compat/auth"
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css'
import { config } from '../config'
import { sendSignInLinkToEmail } from 'firebase/auth';

// https://firebase.google.com/docs/auth/web/email-link-auth

document.getElementById('signInForm')?.addEventListener('submit', signIn)

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

  const auth = getFirebase().auth
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

function connectToEmulators({ auth, firestore }) {
  if (location.hostname === 'localhost' && config.useEmulator) {
    firestore.useEmulator('localhost', 8080)
    auth.useEmulator('http://localhost:9099')
  }
}

export function getFirebase() {
  const isConfigured = firebase.apps.length > 0
  const firebaseApp = firebase.initializeApp(config.firebase);
  const firestore = firebase.firestore()
  const auth = firebase.auth()
  const services = { firebaseApp, firestore, auth, isConfigured }
  
  if (!services.isConfigured) {
    connectToEmulators(services)
  }
  return services
}

getFirebase()

const uiConfig = {
  callbacks: {
    // Called when the user has been successfully signed in.
    signInSuccessWithAuthResult: function(authResult, redirectUrl) {
      if (authResult.user) {
        console.log(`logged in user ${authResult.user.uid}`)
      }
      if (authResult.additionalUserInfo) {
        if (authResult.additionalUserInfo.isNewUser) {
          console.log(`${authResult.user.id} is NEW!`)
          
          const db = firebase.firestore();
          let userName = authResult.user.displayName
          if (!userName) {
            userName = authResult.user.email?.split('@')[0] ?? 'Anonymous Rider'
          }    
          db.collection("users").doc(authResult.user.uid).set({
            userName
          })
          .then(() => {
            console.log("Document successfully written!");
          })
          .catch((error) => {
            console.error("Error writing document: ", error);
          });
        }
      }
      console.log(`Should redirect to "${redirectUrl}"`)
      return true;
    }
  },
  signInFlow: 'popup',
  signInSuccessUrl: '/user.html',
  signInOptions: [
    // firebase.auth.EmailAuthProvider.PROVIDER_ID,
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.FacebookAuthProvider.PROVIDER_ID,
    firebase.auth.TwitterAuthProvider.PROVIDER_ID,
    "apple.com",
    "microsoft.com",
    "yahoo.com"
  ],
  tosUrl: '/',
  privacyPolicyUrl: '/'
}


// Initialize the FirebaseUI Widget using Firebase.
const ui = new firebaseui.auth.AuthUI(firebase.auth());

ui.start('#firebaseui-auth-container', uiConfig);