/// <reference types="cypress" />

describe('Uploading', () => {
  beforeEach(() => {
    // register a new user
    cy.login()
  })

  it('can upload RS files', function() {
    cy
      .fixture('allactions.rs')
      .then((rsEnduro) => {
        cy.visit('/import.html')
        cy.get('textarea[id=rs]').type(rsEnduro)
        cy.get('button#import').click()
        cy.url().should('include', '/enduro')
        cy.contains('08:30:00')
      })
  })
})
