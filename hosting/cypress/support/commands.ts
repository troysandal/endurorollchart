/// <reference types="cypress" />

declare global {
  namespace Cypress {
    // type Greeting = {
    //   greeting: string,
    //   name: string
    // }

    interface Chainable {
      seedEnduro: typeof seedEnduro
    }
  }
}

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import 'firebase/compat/firestore';
import { attachCustomCommands } from 'cypress-firebase';

const config = {
  firebase: {
    apiKey: "AIzaSyAgkQQRVx00IO54FZCbgAR7YX-h7mDwPZ0",
    authDomain: "endurorollchart.firebaseapp.com",
    projectId: "endurorollchart",
    storageBucket: "endurorollchart.appspot.com",
    messagingSenderId: "822901650009",
    appId: "1:822901650009:web:6565b1bb3094cb08003748"
  },
  useEmulator: true
}
function connectToEmulators({ auth, firestore }) {
  if (config.useEmulator) {
    console.log('using emulators')
    firestore.settings({
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: false,
      merge: true,
      host: 'localhost:8080',
      ssl: false
    });
    firestore.useEmulator('localhost', 8080)
    auth.useEmulator('http://localhost:9099')
  }
}

export function setupFirebase() {
  const isConfigured = firebase.apps.length > 0
  const firebaseApp = firebase.initializeApp(config.firebase);
  const firestore = firebase.firestore()
  const auth = firebase.auth()
  const services = { firebaseApp, firestore, auth, isConfigured }
  
  if (!services.isConfigured) {
    connectToEmulators(services)
  }
  attachCustomCommands({ Cypress, cy, firebase})
  return services
}

setupFirebase()


export function seedEnduro() {
  const routeId = 'asdf123'
  return cy.fixture('allactions.json')
    .then((enduro) => {
      enduro.userId = Cypress.env('TEST_UID')
      enduro.createdAt = firebase.firestore.Timestamp.now()
      enduro.updatedAt = firebase.firestore.Timestamp.now()
      return cy.callFirestore('set', `enduros/${routeId}`, enduro)
    })
    .then(() => {
      cy.wrap(routeId).as('routeId')
    })
}

Cypress.Commands.add('seedEnduro', seedEnduro)
