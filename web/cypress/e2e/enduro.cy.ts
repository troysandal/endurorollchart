/// <reference types="cypress" />

describe('Enduro Route Sheet', () => {
  beforeEach(() => {
    // seed a user in the DB that we can control from our tests
    // every password is the same so we can login as that user if needed
    cy
      .login()
      .seedEnduro()
  })

  it('displays enduro with statistics', function() {
    cy.visit(`/enduro.html?id=${this.routeId}`)

    // Route Statistics
    cy.contains('Reset Distance')

    // Route Sheet and some actions
    cy.get('table.routeSheet').should('exist')
    cy.contains('09:05:00')
    cy.contains('Reset to 0')
  })

  it('prints clean routesheet', function() {
    cy.visit(`/enduroPrint.html?id=${this.routeId}`)

    // Route Statistics
    cy.contains('Reset Distance').should('not.exist')

    // Route Sheet and some actions
    cy.get('table.routeSheet').should('exist')
    cy.contains('09:05:00')
    cy.contains('Reset to 0')
  })
})
