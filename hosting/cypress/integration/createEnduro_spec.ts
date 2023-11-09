/// <reference types="cypress" />

import { speed } from "../../node_modules/cypress/types/jquery/index"
import { addSyntheticLeadingComment } from "../../node_modules/typescript/lib/typescript"

function addSpeedChange(distance, speed) {
  cy.get('table > tbody > :last-child').within(() => {
    cy.get('select').select('speed')
  })
  cy.get('table > tbody > :last-child').within(() => {
    cy.get('input.distance').clear().type(distance)
    cy.get('input.speed').clear().type(speed)
    cy.get('button').first().click()
  })
}

function addGasStop(distance) {
  cy.get('table > tbody > :last-child').within(() => {
    cy.get('select').select('gasStop')
  })
  cy.get('table > tbody > :last-child').within(() => {
    cy.get('input.distance').first().clear().type(distance)
    cy.get('button').first().click()
  })
}

function addNote(distance, note) {
  cy.get('table > tbody > :last-child').within(() => {
    cy.get('select').select('note')
  })
  cy.get('table > tbody > :last-child').within(() => {
    cy.get('input.distance').clear().type(distance)
    cy.get('input.note').type(note)
    cy.get('button').first().click()
  })
}


describe('Enduro creation', () => {
  beforeEach(() => {
    // seed a user in the DB that we can control from our tests
    cy.register();
  })

  it('creates new enduro', () => {
    cy.visit(`/user`)

    cy.contains('New Enduro')

    cy.get('button#create').click()
    cy.url().should('include', '/enduro')
    const title = 'My\nAwesome\nEnduro'
    cy.get('textarea#title')
      .clear()
      .type(title).should('have.value', title)

    /* Route Actions
      key time 9:30
      0   speed 18 (just hit insert)
      2.7 note 'mileage check'
      3.0 speed 24
      3.4 reset 3.8
      3.8 speed 18
      4.1 speed 24
      4.1 gas stop
    */
    cy.get('table > tbody > :last-child').within(() => {
        cy.get('input.time').clear().type('9:30\n').should('have.value', '09:30:00')
        cy.get('button').click()
    })
    cy.get('table > tbody > tr').should('have.length', 2)

    cy.get('table > tbody > :last-child').within(() => {
      cy.get('select').select('start')
    })
    cy.get('table > tbody > :last-child').within(() => {
      cy.get('input.distance').first().clear().type('0.7')
      cy.get('button').first().click()
    })

    addNote('2.7', 'mileage check')

    addSpeedChange(3, 24)

    cy.get('table > tbody > :last-child').within(() => {
      cy.get('select').select('reset')
    })
    cy.get('table > tbody > :last-child').within(() => {
      cy.get('input.distance').first().clear().type('3.4')
      cy.get('input.distance').last().clear().type('3.8')
      cy.get('button').first().click()
    })
    addSpeedChange(3.8, 18)
    addSpeedChange(4.1, 24)

    addGasStop(4.2)

    // check for error
    cy.get('table > tbody > :last-child').within(() => {
        cy.get('td > img').should('exist')
    })
    cy.get("td > img").should('be.visible')

    // Free Time (should remove error)
    cy.get('table > tbody > :last-child').within(() => {
      cy.get('select').select('freeTime')
    })
    cy.get('table > tbody > :last-child').should('not.have.class', 'error')
    cy.get('table > tbody > :last-child').within(() => {
      cy.get('input.minutes').first().clear().type('15')
      cy.get('button').first().click()
    })

    // Free To
    cy.get('table > tbody > :last-child').within(() => {
      cy.get('select').select('freeZone')
    })
    cy.get('table > tbody > :last-child').within(() => {
      cy.get('input.distance').last().clear().type('4.5')
      cy.get("td > img").should('not.be.visible')
      cy.get('button').first().click()
    })

    // Delete last item, then re-add back
    cy.get('table > tbody > :last-child').within(() => {
      cy.get('button').last().click()
    })

    cy.get('table > tbody > :last-child').within(() => {
      cy.get('select').select('freeZone')
    })
    cy.get('table > tbody > :last-child').within(() => {
      cy.get('input.distance').last().clear().type('4.5')
      cy.get("td > img").should('not.be.visible')
      cy.get('button').first().click()
    })

    // Known
    cy.get('table > tbody > :last-child').within(() => {
      cy.get('select').select('known')
    })
    cy.get('table > tbody > :last-child').within(() => {
      cy.get('input.distance').first().clear().type('4.8')
      cy.get("td > img").should('not.be.visible')
      cy.get('button').first().click()
    })

    // Reset to 0
    cy.get('table > tbody > :last-child').within(() => {
      cy.get('select').select('resetTo0')
    })
    cy.get('table > tbody > :last-child').within(() => {
      cy.get('input.distance').first().clear().type('5.3')
      cy.get('select').focus()
      cy.get("td > img").should('not.be.visible')
      cy.get('button').first().click()
    })

    // Lap 2
    addGasStop(0.8)
    addNote(1.5, 'careful')

    // Delete the speed change that was appended by default
    cy.get('table > tbody > :last-child').within(() => {
      cy.get('button').last().click()
    })

    // Test inserting Speed before Reset to 0
    cy.get('table > tbody > :nth-last-child(4)').within(() => {
      // This presses the Insert button on the Known before Reset to 0
      // Results in a Speed @ 4.8
      cy.get('button').first().click()
    })
    cy.get('table > tbody > :nth-last-child(4)').within(() => {
      cy.get('select').select('speed')
    })
    cy.get('table > tbody > :nth-last-child(4)').within(() => {
      cy.get('input.distance').first().clear().type('4.9')
      cy.get('input.speed').first().clear().type('24')
      // Something wacky happens and we have to do this over again
      // because the speed, though it says 24, is actually 18 still!
      // Redo this otherwise the subsequent Reset0@5.3 is considered invalid.
      cy.get('select').focus()
      cy.get('input.distance').first().clear().type('4.9')
      cy.get('input.speed').first().clear().type('24')
      cy.get("td > img").should('not.be.visible')
    })

    // End
    cy.get('table > tbody > :last-child').within(() => {
      cy.get('select').select('end')
    })
    cy.get('table > tbody > :last-child').within(() => {
      cy.get('input.distance').first().clear().type('5.12')
      // cy.get('button').first().click()
    })

    // Mutate Lap 1 Note to Speed 18
    let selector = 'table > tbody > :nth-child(3)'
    cy.get(selector).within(() => {
      cy.get('select').select('speed')
    })
    cy.get(selector).within(() => {
      cy.get('input.speed').clear().type('18')
      cy.get('button').first().focus()
    })

    // Mutate Previous Speed Back to Note & Change Lap
    cy.get(selector).within(() => {
      cy.get('select').select('note')
    })
    cy.get(selector).within(() => {
      cy.get('input.note').type('noted again')
      cy.get('input.lap').clear().type('a')
      cy.get('button').first().focus()
      cy.get('input.lap').type('2')
    })

    cy.get('button#save').click()
  })
})
