import Enduro from '../../src/timekeeping/enduro'
import { expect } from 'chai'
import {} from 'mocha'

describe('enduro', function() {
  describe('title', function() {
    it('should support getting and setting', function() {
      const enduro = new Enduro()
      var title = "Foo Bar\n2017"
      enduro.title = title
      expect(enduro.title).to.equal(title)
    })

    it('should support multiple lines', function() {
      const enduro = new Enduro()
      var title = "Foo Bar\n2017"
      enduro.title = title
      expect(enduro.title.split('\n').length).to.equal(2)
    })
  })

  describe('route sheet', () => {
    it('should be defined by default', () => {
      const enduro = new Enduro()
      expect(enduro.routeSheet).to.not.be.undefined
    })
  })
})
