/// <reference types="cypress" />

describe('Home Page', () => {
  it('actually loads', () => {
    cy.visit('/')
    cy.contains('Enduro Roll Charts')
  })
})
