import { getFirebase } from '../firebase'
import { collection, getDocs, query } from 'firebase/firestore'

const { firestore } = getFirebase()

document.getElementById('export')?.addEventListener('click', async () => {
  const data = {
    enduros: {},
    users: {},
  }
  async function getCollection(name) {
    const q = query(collection(firestore, name))
    const snapshot = await getDocs(q)

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
