import 'mocha'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)

import fs from 'fs'
import {
  collection,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  getDocs
} from 'firebase/firestore'
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing"


describe('Firestore Rules', function() {
  let testEnv: RulesTestEnvironment

  beforeEach(async function() {
    await testEnv.clearFirestore()
  })

  before(async function() {
    testEnv = await initializeTestEnvironment({
      projectId: "endurorollchart",
      hub: {
        host: '127.0.0.1',
        port: 4400
      },
      firestore: {
        rules: fs.readFileSync("../firestore.rules", "utf8"),
      },
    });
  })
  
  after(async function() {
    await testEnv.cleanup()
  })

  async function createAliceEnv() {
    return createUser('alice', 'Alice Waters')
  }

  async function createBobEnv() {
    return createUser('bob', 'Bob Newhart')
  }

  async function createUser(uid: string, name: string) {
    const context = testEnv.authenticatedContext(uid)
    const db = context.firestore()
    const aliceRef = doc(db, "users", uid)
    await setDoc(aliceRef, { name })

    // You cannot re-use the context after making a change, e.g. calling
    // setDoc(), after that context.firestore() throws a weird error saying
    // Firebase is already setup and setting can't change.
    // This fixes that.
    return testEnv.authenticatedContext(uid)
  }

  describe('says Users...', function() {
    it('can create/read/update self', async function() {
      const context = testEnv.authenticatedContext('alice')
      const db = context.firestore()

      // Create your Users document
      const aliceRef = doc(db, "users", 'alice')
      await setDoc(aliceRef, { name: 'Alice Waters' })

      // Update your Users document
      await updateDoc(aliceRef, { nickname: 'Ali' })
      const aliceSnap = await getDoc(aliceRef)
      expect(aliceSnap.exists()).to.be.true

      // Verify update worked
      const data = aliceSnap.data() as any
      expect(data.name).to.eq('Alice Waters')
      expect(data.nickname).to.eq('Ali')
    })


    it('cannot delete self', async function() {
      const context = await createAliceEnv()
      const db = context.firestore()
      const aliceRef = doc(db, "users", 'alice')

      await expect(deleteDoc(aliceRef)).to.be.rejected
    })

    it('cannot create new users', async function() {
      const context = testEnv.authenticatedContext('alice')
      const db = context.firestore()
      const aliceRef = doc(db, "users", 'bob')
      await expect(setDoc(aliceRef, { name: "Bob Newhart" })).to.be.rejected
    })


    it('cannot update other users', async function() {
      await createBobEnv()
      const aliceContext = await createAliceEnv()
      const bobRef = doc(aliceContext.firestore(), "users", 'bob')
      await expect(updateDoc(bobRef, { role: 'agent' })).to.be.rejected
    })

    it('cannot delete other users', async function() {
      await createBobEnv()
      const aliceContext = await createAliceEnv()
      const bobRef = doc(aliceContext.firestore(), "users", 'bob')
      await expect(deleteDoc(bobRef)).to.be.rejected
    })

    it('can be listed by anyone', async function () {
      const aliceContext = await createAliceEnv()
      await createBobEnv()
      const db = aliceContext.firestore()

      // Alice lists all users in database
      const q = query(collection(db, "users"));
      const querySnapshot = await getDocs(q);
      expect(querySnapshot.size).to.eq(2)
    })

  })

  describe('says Enduros', function() {
    it('can be created/updated if owned by self', async function() {
      const aliceContext = await createAliceEnv()
      const db = aliceContext.firestore()
      await setDoc(doc(db, 'enduros', 'enduroA'), {
        title: "Enduro A",
        userId: 'alice'
      })
      await expect(updateDoc(doc(db, 'enduros', 'enduroA'), {title: 'New Title'})).to.be.fulfilled
    })

    it('cannot be created on behalf of others', async function() {
      const aliceContext = await createAliceEnv()
      const db = aliceContext.firestore()
      await expect(setDoc(doc(db, 'enduros', 'enduroForBob'), {
        title: "Enduro For Bob",
        userId: 'bob'
      })).to.be.rejected
    })

    it('cannot be updated by others', async function() {
      const aliceContext = await createAliceEnv()
      const db = aliceContext.firestore()
      await setDoc(doc(db, 'enduros', 'enduroA'), {
        title: "Enduro A",
        userId: 'alice'
      })

      const bobContext = await testEnv.authenticatedContext('bob')
      const bobDb = bobContext.firestore()
      await expect(
        updateDoc(
          doc(bobDb, 'enduros', 'enduroA'), 
          { title: 'Hacked Title' }
        )).to.be.rejected
    })

    it('can be deleted if owned by self', async function() {
      const aliceContext = await createAliceEnv()
      const db = aliceContext.firestore()
      await setDoc(doc(db, 'enduros', 'enduroA'), {
        title: "Enduro A",
        userId: 'alice'
      })
      await deleteDoc(doc(db, 'enduros', 'enduroA'))
    })


    it('can be read by anyone', async function() {
      const aliceContext = await createAliceEnv()
      const db = aliceContext.firestore()
      await setDoc(doc(db, 'enduros', 'enduroA'), {
        title: "Enduro A",
        userId: 'alice'
      })

      // Bob read's one of Alice's enduros by Id (get)
      const bobContext = await testEnv.authenticatedContext('bob')
      const bobDb = bobContext.firestore()
      await expect(getDoc(doc(bobDb, 'enduros', 'enduroA'))).to.be.fulfilled
    })


    it('can be listed by anyone', async function () {
      const aliceContext = await createAliceEnv()
      const db = aliceContext.firestore()
      await setDoc(doc(db, 'enduros', 'enduroA'), {
        title: "Enduro A",
        userId: 'alice'
      })
      await setDoc(doc(db, 'enduros', 'enduroAA'), {
        title: "Enduro AA",
        userId: 'alice'
      })

      // Bob reads both Alice's enduros (list)
      const bobContext = await testEnv.authenticatedContext('bob')
      const bobDb = bobContext.firestore()
      const q = query(collection(bobDb, "enduros"));
      const querySnapshot = await getDocs(q);
      expect(querySnapshot.size).to.eq(2)
    })
  })
})
