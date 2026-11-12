import RouteSheet from '../../src/timekeeping/routesheet'
import {default as Util, EventDispatcher} from '../../src/timekeeping/util';
import { expect } from 'chai';
import { SpeedBehavior } from '../../src/pages/behaviors';

describe('SpeedBehavior', () => {
  it('only allows non-zero speeds', () => {
    const input = {on:() => {}}
    const behavior = new SpeedBehavior(input, (_o, _n) => {
    });
    expect(behavior.isValidValue(0)).to.be.false;
    expect(behavior.isValidValue(1)).to.be.true;
  })

  it('supports arbitrary min/max', () => {
    const input = {on:() => {}}
    const behavior = new SpeedBehavior(input, (_o, _n) => {
    });
    behavior._min = 2
    expect(behavior.isValidValue(1)).to.be.false;
    expect(behavior.isValidValue(2)).to.be.true;

    behavior._min = Number.NEGATIVE_INFINITY
    expect(behavior.isValidValue(-1)).to.be.true;
  })
})

describe('utility method', function() {
  describe('secondsToTime', function() {
    it('will add a seconds offset to keytime', function() {
      var routeSheet = new RouteSheet();
      routeSheet.setKeyTime(9 * 60 * 60);
      var result = Util.secondsToTime(routeSheet.getKeyTime(), 30 * 60);
      expect(result).to.equal('09:30:00');
    });
  });

  describe('keyTimeNoSeconds', function() {
    it('will not return seconds', function() {
      var routeSheet = new RouteSheet();
      routeSheet.setKeyTime(9 * 60 * 60);
      var result = Util.keyTimeNoSeconds(routeSheet.getKeyTime());
      expect(result).to.equal('9:00');
    });

    it('can prefix hour with a zero', function() {
      var routeSheet = new RouteSheet();
      routeSheet.setKeyTime(9 * 60 * 60);
      var result = Util.keyTimeNoSeconds(routeSheet.getKeyTime(), true);
      expect(result).to.equal('09:00');
    });
  });

  describe('EventDispatcher', function() {
    var eventName = 'test123';

    it('should dispatch events by name', function() {
      var source = new EventDispatcher();
      var count = 0;
      var listener = function(event) {
        count++;
        expect(event.name).to.equal(eventName);
      }
      source.on(eventName, listener);
      source.dispatch({name: eventName});
      expect(count).to.equal(1);
    });

    it('can register for multiple events at once', function() {
      var source = new EventDispatcher();
      var count = 0;
      var listener = function(_event) {
        count++;
      }
      source.on('l1 l2', listener);
      source.dispatch({name: 'l1'});
      expect(count).to.equal(1);
      source.dispatch({name: 'l2'});
      expect(count).to.equal(2);
      source.off('l1 l2', listener);

      source.dispatch({name: 'l1'});
      expect(count).to.equal(2);
      source.dispatch({name: 'l2'});
      expect(count).to.equal(2);
    });

    it('should dispatch events once', function() {
      var source = new EventDispatcher();
      var listener = function(event) {
        expect(event.name).to.equal(eventName);
      }
      source.on(eventName, listener);
      source.dispatch({name: eventName});
    });

    it('should support multiple listeners', function() {
      var source = new EventDispatcher();
      var count1 = false, count2 = false;
      var listener1 = function(_event) {
        count1 = true;
      }
      var listener2 = function(_event) {
        count2 = true;
      }
      source.on(eventName, listener1);
      source.on(eventName, listener2);
      source.dispatch({name: eventName});
      expect(count1).to.be.true;
      expect(count2).to.be.true;
    });

    it('should unregister listeners', function() {
      var source = new EventDispatcher();
      var count = 0;
      var listener = function(_event) {
        count++;
        expect(count).to.equal(1);
      }
      source.on(eventName, listener);
      source.dispatch({name: eventName});
      source.off(eventName, listener);
      source.off(eventName, listener);
      source.dispatch({name: eventName});
      expect(count).to.equal(1);
    });

    it('should register same listener multiple times', function() {
      var source = new EventDispatcher();
      var count = 0;
      var listener = function() {
        count++;
      }
      source.on(eventName, listener);
      source.on(eventName, listener);
      source.dispatch({name: eventName});
      expect(count).to.equal(2);
    });

    it('should unregister duplicate listeners at same time', function() {
      var source = new EventDispatcher();
      var count = 0;
      var listener = function() {
        count++;
      }
      source.on(eventName, listener);
      source.on(eventName, listener);
      source.dispatch({name: eventName});
      expect(count).to.equal(2);
      source.off(eventName, listener);
      count = 0;
      source.dispatch({name: eventName});
      expect(count).to.equal(0);
    });
  });
});
