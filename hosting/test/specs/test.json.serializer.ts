import {fromJSON, toJSON} from '../../src/timekeeping/serializeJSON';
import Enduro from '../../src/timekeeping/enduro'
import { expect } from 'chai';

describe('serializers', function() {
  describe('for JSON', function() {
    it('should read and write all actions', function() {
      const inJSON = {
        title: "A\nB\bC",
        version: "2",
        routeSheet: {
          keyTime: 8 * 60 * 60,
          actions: [
            { distance: 0.00, type: 'speedChange',    speed: 18 },
            { distance: 3.31, type: 'reset',    toDistance: 396 },
            { distance: 4.00, type: 'freeTime', minutes: 5 },
            { distance: 4.30, type: 'note',     note: 'sadf' },
            { distance: 9.00, type: 'resetToZero' },
            { distance: 3.00, type: 'gasStop' },
            { distance: 3.00, type: 'known' },
            { distance: 8.50, type: 'freeZone', toDistance: 1087 },
            { distance: 9.00, type: 'start' },
            { distance: 12.0, type: 'end' }
          ]
        }
      }
      const enduro:Enduro = fromJSON(inJSON);
      expect(enduro.title).to.equal(inJSON.title)
      const outJSON = toJSON(enduro);

      const inActions = inJSON.routeSheet.actions;
      const outActions = outJSON.routeSheet.actions;

      expect(inActions.length, "action counts").to.equal(outActions.length);

      inActions.forEach(function(inAction, index) {
        const outAction = outActions[index];
        const inType = Object.keys(inAction.type)[0];
        const outType = Object.keys(outAction.type)[0];
        expect(inType).to.equal(outType);

        Object.keys(inAction).forEach(function(key) {
          if (key !== 'type') {
            const expected = inAction[key]
            const actual = outAction[key]
            expect(expected).to.equal(actual);
          }
        })
      });
    });
  });

});
