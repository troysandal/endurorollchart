import { updateProfile } from 'firebase/auth';
import { getFirebase, onAuth } from '../firebase'
import { collection, query, where, getDocs, deleteDoc, doc, setDoc, getDoc, orderBy } from 'firebase/firestore'

$('#changeUserName').on('click', async function () {
  const { auth, firestore } = getFirebase()

  if (auth.currentUser) {
    let newName = prompt('Enter new username.')
    if (newName === null) {
      console.log('cancelled')
      return
    }
    newName = newName.trim()

    await updateProfile(auth.currentUser, {displayName: newName})
    await setDoc(doc(firestore, 'users', auth.currentUser.uid), {
      userName: newName
    })
    window.location.reload()
  } else {
    alert('Sorry, you must be logged in.')
  }
});

$('#create').on('click', function () {
  window.location.pathname = "/enduroEdit.html";
});

$('#import').on('click', function () {
  window.location.pathname = "/import.html";
});

function addListeners() {
  $('.routeSheet').on('click', function (e) {
    const routeId = e.target.dataset.id
    window.location.href = `/enduro.html?id=${routeId}`
  });

  $('.jart').on('click', function (e) {
    const routeId = e.target.dataset.id
    window.location.href = `/jart.html?id=${routeId}`
  });

  $('.delete').on('click', async function (e) {
    const title = e.target.dataset.title
    const routeId = e.target.dataset.id

    if (window.confirm("Are you sure you want to delete '" + title + "'?")) {
      const db = getFirebase().firestore;
      e.target.closest("tr")?.remove()
      try {
        await deleteDoc(doc(db, 'enduros', routeId as string))
        updateViewCount()
        console.log(`Deleted enduro ${routeId}`)
      } catch (e) {
        console.error(`Failed to delete enduro ${routeId}`)
        console.error(e)
      }
    }
  });
}

onAuth((user) => {
  console.log(`got user ${user.uid}`)
  
  if (user) {
    init(user)
  } else {
    window.location.pathname = '/'
  }
});

async function init(user) {
  // Update User Info
  const userSnap = await getDoc(doc(getFirebase().firestore, "users", user.uid))
  const userData = userSnap.data()
  $('#userName').text(userData?.userName ?? '<not set>')
  $('#email ').text(user.email)

  // Query for all users's enduros
  const myEndurosRef = collection(getFirebase().firestore, "enduros");
  const q = query(
    myEndurosRef, 
    where("userId", "==", user.uid), 
    orderBy('createdAt', 'desc')
  );

  // Run query and render
  const snapshot = await getDocs(q);
  const tbody = document.querySelector('tbody')
  const template = document.querySelector('#enduroTemplate')

  const rows = snapshot.docs.map((doc) => {
    return { id:doc.id, ...doc.data() }
  })

  for (let row of rows) {
    const clone = (template as HTMLTemplateElement)?.content.cloneNode(true) as HTMLElement
    const titleLink = clone.querySelector('a') as HTMLAnchorElement
    titleLink.href = `/enduroEdit.html?id=${row.id}`
    titleLink.textContent = formatTitle(row['title'])
    const buttons = clone.querySelectorAll('button')
    for (let button of buttons) {
      button.dataset.id = row.id  
      button.dataset.title = formatTitle(row['title'])
    }
    tbody?.appendChild(clone)
  }

  updateViewCount()
  addListeners()
}

function updateViewCount() {
  const viewCount = document.querySelectorAll('tbody > tr').length
  const table = document.querySelector('table') as HTMLElement

  if (viewCount === 0) {
    table.hidden = true

    const noEnduros = document.getElementById('noEnduros') as HTMLElement
    noEnduros.hidden = false
    return
  } else {
    table.hidden = false
  }
}

function formatTitle(title) {
  if (!title || title.trim().length === 0) {
    title = "[NO NAME]"
  }
  
  return title
}
