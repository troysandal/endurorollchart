/// <reference types="cypress" />

describe('JART', () => {
  beforeEach(() => {
    // seed a user in the DB that we can control from our tests
    // every password is the same so we can login as that user if needed
    cy
      .login()
      .seedEnduro()
  })

  it('displays JARTs', function() {
    cy.visit(`/jart?id=${this.routeId}`)
    cy.contains(`from 3.31`)
    cy.get('input#zeroKeyTime').should('exist')
    cy.get('tr.jart_keyTime + tr.jart_speed > :first-child')
      .should('have.text', '30')
    cy.get('input#zeroKeyTime').click()
    cy.get('tr.jart_keyTime + tr.jart_speed > :first-child')
      .should('have.text', '00')
  })

  it('can display minutes in left column', function() {
    cy.visit(`/jart?id=${this.routeId}`)
    
    cy.get('input#timeInLeftColumn').should('exist')
    cy.get('tr.jart_speed > :first-child')
      .should('have.text', '30')
    cy.get('input#timeInLeftColumn').click()
    cy.get('tr.jart_speed > :first-child')
      .should('have.text', '0.0')
  })
})
