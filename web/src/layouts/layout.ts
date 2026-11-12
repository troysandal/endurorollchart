import { getDoc, doc } from 'firebase/firestore'
import { onAuth, getFirebase } from '../firebase'
import { signOut } from 'firebase/auth'

$('#logout').on('click', async () => {
  await signOut(getFirebase().auth)
  window.location.pathname = '/'
})

onAuth(async (user) => {
  if (user) {
    const snapshot = await getDoc(doc(getFirebase().firestore, "users", user.uid))
    const userData = snapshot.data()
    const userName = userData?.userName ?? 'Anonymous Rider'

    console.log(`welcome ${userName}`)
    $('#loggedOut').hide()
    $('#loggedIn').show()
    $('#userLink').text(`Hi ${userName}`)
  } else {
    console.log('nobody logged in')
    $('#loggedOut').show()
    $('#loggedIn').hide()
  }
})
