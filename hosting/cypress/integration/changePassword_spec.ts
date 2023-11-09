/// <reference types="cypress" />


describe('Password changes', () => {
  interface apiChangePassword {
    currentPassword?: string,
    newPassword?: string,
    verifyPassword?: string,
  }

  beforeEach(() => {
    cy.register()
  })

  it('requires the current password to match', function () {
    const badCurrentPassword: apiChangePassword = {
      currentPassword: `${this.currentUser.password}42`
    }
    cy
      .request({
        method: 'POST',
        url: '/change-password',
        body: badCurrentPassword,
        followRedirect: false
      })
      .then((response) => {
        expect(response.status).to.equal(303)
      })
  })

  it('new passwords must match', function () {
    const badCurrentPassword: apiChangePassword = {
      currentPassword: `${this.currentUser.password}`,
      newPassword: 'password',
      verifyPassword: 'p4ssword'
    }
    cy
      .request({
        method: 'POST',
        url: '/change-password',
        body: badCurrentPassword,
        followRedirect: false
      })
      .then((response) => {
        expect(response.status).to.equal(303)
      })
  })

  it('new passwords be 8 chars are more', function () {
    const badCurrentPassword: apiChangePassword = {
      currentPassword: `${this.currentUser.password}`,
      newPassword: 'passwor',
      verifyPassword: 'passwor'
    }
    cy
      .request({
        method: 'POST',
        url: '/change-password',
        body: badCurrentPassword,
        followRedirect: false
      })
      .then((response) => {
        expect(response.status).to.equal(303)
      })
  })

  it('succeed with good params', function () {
    const badCurrentPassword: apiChangePassword = {
      currentPassword: `${this.currentUser.password}`,
      newPassword: 'password42',
      verifyPassword: 'password42'
    }
    cy
      .request({
        method: 'POST',
        url: '/change-password',
        body: badCurrentPassword,
        followRedirect: false
      })
      .then((response) => {
        expect(response.status).to.equal(302)
      })
  })
})
