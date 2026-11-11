/// <reference types="cypress" />

const AUTH_EMULATOR = 'http://localhost:9099'
const OOB_CODES_URL = `${AUTH_EMULATOR}/emulator/v1/projects/endurorollchart/oobCodes`

describe('Login page', () => {
  it('shows the email form and Google sign in button', () => {
    cy.visit('/login.html')
    cy.get('#signInForm input[name=email]').should('be.visible')
    cy.contains('button', 'Sign in with Google').should('be.visible')
  })

  it('opens a Google auth popup when the Google button is clicked', () => {
    cy.visit('/login.html', {
      onBeforeLoad(win) {
        // We can't drive a real popup in Cypress, so just verify the click
        // asks Firebase Auth to open one for the Google provider.
        cy.stub(win, 'open').as('popup').returns(null)
      }
    })
    cy.contains('button', 'Sign in with Google').click()
    cy.get('@popup').should('have.been.calledOnce')
    cy.get('@popup').should((stub) => {
      const url = String((stub as any).firstCall.args[0])
      expect(url).to.contain('providerId=google.com')
    })
  })

  it('signs in with an emailed link and creates the user', () => {
    const email = `rider${Date.now()}@example.com`
    const userName = email.split('@')[0]

    cy.visit('/login.html', {
      onBeforeLoad(win) {
        cy.stub(win, 'alert').as('alert')
      }
    })
    cy.get('#signInForm input[name=email]').type(email)
    cy.get('#signInForm').submit()
    cy.get('@alert').should('have.been.calledWithMatch', /emailed you a sign in link/)

    // The Auth emulator records the link it would have emailed.
    cy.request(OOB_CODES_URL)
      .then(({ body }) => {
        const code = body.oobCodes
          .filter((c: any) => c.email === email && c.requestType === 'EMAIL_SIGNIN')
          .pop()
        expect(code, 'sign in code for email').to.exist
        // The emulator link redirects to our continue URL (emailVerify.html)
        return cy.request({ url: code.oobLink, followRedirect: false })
      })
      .then((response) => {
        expect(response.status).to.be.oneOf([301, 302, 303, 307])
        cy.visit(response.redirectedToUrl ?? response.headers.location as string)
      })

    cy.location('pathname', { timeout: 15000 }).should('eq', '/user.html')
    cy.get('#logout').should('exist')

    cy.callFirestore('get', 'users').then((users: any[]) => {
      expect(users.map((u) => u.userName)).to.include(userName)
    })
  })
})
