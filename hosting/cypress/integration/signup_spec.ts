/// <reference types="cypress" />

describe('Account registration', () => {
  it('supports creating new accounts', () => {
    cy.visit('/')
    cy.contains('Enduro Roll Charts')
    cy.contains('Sign Up').click()
    cy.newCredentials().then((user) => {
      cy.url().should('include', '/register')
      cy.get('input[name=username]')
        .type(user.username)
        .should('have.value', user.username)

      cy.get('input[name=password]')
        .type(user.password)
        .should('have.value', user.password)
      cy.contains('Submit').click()
      cy.contains(`Hi ${user.username}`)

      cy.getCookie('connect.sid').should('exist')
      cy.visit('/logout')
      cy.getCookie('connect.sid').should('not.exist')
    })
  })
})
