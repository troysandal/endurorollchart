import { getFirebase } from './firebase'
import { collection, CollectionReference, onSnapshot, orderBy, query, where } from 'firebase/firestore'

createStream(collection(getFirebase().firestore, 'enduros'))

function createStream(ref:CollectionReference) {
  const q = query(ref, where('isPublished', '==', true), orderBy('createdAt', 'desc'))

  return onSnapshot(q, (snapshot) => {
    const rows = snapshot.docs.map((doc) => {
      return { id:doc.id, ...doc.data() }
    })
    const racesDiv = document.querySelector('#enduros') as HTMLElement
    racesDiv.innerText = ''

    for (let row of rows) {
      const wrapper = document.createElement('div')
      const link = document.createElement('a')
      link.href = `/enduro.html?id=${row.id}`
      link.textContent = row['title'] ?? 'untitled'
      wrapper.appendChild(link)
      racesDiv?.appendChild(wrapper)
    }
  })
}
