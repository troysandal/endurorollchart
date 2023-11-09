/// <reference types="cypress" />

import Enduro from '../../src/timekeeping/enduro'
import {fromRS} from '../../src/timekeeping/serializeRS'
import {Versions} from '../../src/timekeeping/serializeJSON'

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// add new command to the existing Cypress interface
// see https://github.com/cypress-io/add-cypress-custom-command-in-typescript/blob/master/cypress/support/commands.ts
declare global {
  namespace Cypress {
    // type Greeting = {
    //   greeting: string,
    //   name: string
    // }

    interface Chainable {
      register: typeof register
      seedEnduro: typeof seedEnduro
      newCredentials: typeof newCredentials
    }
  }
}

export function newCredentials(email?, password = 'password') {
  const currentUser = {
    username: email ?? `user@domain${Math.floor(Math.random() * 1000000)}.com`,
    password
  }
  return cy.wrap(currentUser).as('currentUser')
}
Cypress.Commands.add('newCredentials', newCredentials)


export function register(email?, password?) {
  return cy
    .newCredentials(email, password)
    .then((currentUser) => {
      cy.clearCookies()
      .request('POST', '/register', currentUser)
      .then((response) => {
        expect(response.status).to.equal(200)
    })
  })
}

Cypress.Commands.add('register', register)


export function seedEnduro() {
  return cy.fixture('allactions.rs')
    .then((rsEnduro) => {
      const enduro:Enduro = fromRS(rsEnduro)
      const route = Versions['1'].to(enduro)
      return route
    })
    .then((route) => {
      return cy.request('POST', '/import', { route })
    })
    .then((response) => {
      expect(response.body).to.haveOwnProperty('id')
      const routeId = response.body.id
      cy.wrap(routeId).as('routeId')
    })
}

Cypress.Commands.add('seedEnduro', seedEnduro)
