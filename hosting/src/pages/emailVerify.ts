import { doc, setDoc } from "firebase/firestore";
import { getFirebase } from "../firebase";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";

// Confirm the link is a sign-in with email link.
const {auth, firestore} = getFirebase()

if (isSignInWithEmailLink(auth, window.location.href)) {
  // Additional state parameters can also be passed via URL.
  // This can be used to continue the user's intended action before triggering
  // the sign-in operation.
  // Get the email if available. This should be available if the user completes
  // the flow on the same device where they started it.
  let email = window.localStorage.getItem('emailForSignIn');
  if (!email) {
    // User opened the link on a different device. To prevent session fixation
    // attacks, ask the user to provide the associated email again. For example:
    email = window.prompt('Please provide your email for confirmation');
  }
  // The client SDK will parse the code from the link for you.
  signInWithEmailLink(auth as any, email as string, window.location.href)
    .then(async (result) => {
      // Clear email from storage.
      window.localStorage.removeItem('emailForSignIn');
      // You can access the new user via result.user
      // Additional user info profile not available via:
      // result.additionalUserInfo.profile == null
      // You can check if the user is new or existing:
      // result.additionalUserInfo.isNewUser

      let userName = result.user.displayName
      if (!userName) {
        userName = result.user.email?.split('@')[0] ?? 'Anonymous Rider'
      }
      await setDoc(doc(firestore, 'users', result.user.uid), {
        userName
      })
      window.location.href = '/user.html'  
    })
    .catch((error) => {
      // Some error occurred, you can inspect the code: error.code
      // Common errors could be invalid email and invalid or expired OTPs.
      console.log(error)
      alert("Sorry, we couldn't log you in, please try again")
      window.location.href = '/login.html'
    });
}
