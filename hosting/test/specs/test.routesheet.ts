import RouteSheet from '../../src/timekeeping/routesheet'
import {
  SpeedChange, ResetTo0, Note, Reset, Known,
  FreeTime, FreeZone, Action, End, Start, GasStop, ActionType
} from '../../src/timekeeping/actions';
import { expect } from 'chai';
import {} from 'mocha';

/**
 * Helper to append an action to a route sheet and return any error produced.
 */
function append(routeSheet:RouteSheet, action:Action): string|null {
  routeSheet.appendAction(action)
  return action.error
}

const TYPE_TO_INSTANCE:{[index:string]: (distance:number, param?:string|number) => Action} = {
  [ActionType.SpeedChange]: (distance, param?:string|number) => new SpeedChange(distance, param as number),
  [ActionType.FreeTime]:    (distance, param?:string|number) => new FreeTime(distance, param as number),
  [ActionType.Note]:        (distance, param?:string|number) => new Note(distance, param),
  [ActionType.GasStop]:     (distance) => new GasStop(distance),
  [ActionType.Reset]:       (distance, param?:string|number) => new Reset(distance, param  as number),
  [ActionType.FreeZone]:    (distance, param?:string|number) => new FreeZone(distance, param as number),
  [ActionType.ResetToZero]: (distance) => new ResetTo0(distance),
  [ActionType.Known]:       (distance) => new Known(distance),
  [ActionType.Start]:       (distance) => new Start(distance),
  [ActionType.End]:         (distance) => new End(distance),
}

function createFromType(type:ActionType, distance:number, param?:string|number) {
  return TYPE_TO_INSTANCE[type](distance, param)
}

describe('route sheet', function() {
  describe('actions', function() {
    var ACTIONS_AND_DEFAULT_PARAMS = [
      { type: ActionType.SpeedChange, distance: 0.00, param: 30, paramName: 'speed' },
      { type: ActionType.Reset, distance: 3.31, param: 4.96, paramName: 'to', paramExpect: 4.96 },
      { type: ActionType.FreeTime, distance: 4.00, param: 6, paramName: 'freeTime', paramExpect:6 },
      { type: ActionType.Note, distance: 4.30, param: 'sadf', paramName: 'note' },
      { type: ActionType.ResetToZero, distance: 9.00 },
      { type: ActionType.GasStop, distance: 3.00 },
      { type: ActionType.Known, distance: 7.00 },
      { type: ActionType.FreeZone, distance: 8.50, param: 10.87, paramName: 'to', paramExpect: 10.87 },
      { type: ActionType.Start, distance: 9.00 },
      { type: ActionType.End, distance: 12.00 }
    ];

    it('are creatable by type', function() {
      ACTIONS_AND_DEFAULT_PARAMS.forEach(function(action:any) {
        var instance = createFromType(action.type, action.distance, action.param);
        expect(instance.type).to.equal(action.type);
        expect(instance.distance, action.type + '.distance').to.equal(action.distance);
        if (action.paramName) {
          let expected
          if (typeof instance[action.paramName] === 'function')
            expected = instance[action.paramName].call(instance)
          else
            expected = instance[action.paramName]
          expect(expected, action.paramName).to.equal(action.paramExpect || action.param);
          if (action.paramName === 'to') {
            var instance2 = createFromType(action.type, action.distance, action.param);
            instance2.distance = instance2.distance + 1;
            expect(instance2.distance, instance.type).to.equal(instance.distance + 1);
            expect(instance2.distanceToGoInTenths, instance.type).to.not.equal(instance.distanceToGoInTenths);
            expect(instance2.endDistanceInTenths, instance.type).to.equal(instance.endDistanceInTenths);
          }
          else {
            var instance2 = createFromType(action.type, action.distance, action.param);
            instance2.distance = instance2.distance + 1;
            expect(instance2.distance, instance.type).to.equal(instance.distance + 1);
            expect(instance2.distanceToGoInTenths, instance.type).to.equal(instance.distanceToGoInTenths);
            expect(instance2.endDistanceInTenths, instance.type).to.equal(instance.endDistanceInTenths);
          }
        }
      });
    });

    it('has copy constructors', function() {
      ACTIONS_AND_DEFAULT_PARAMS.forEach(function(action:any) {
        var instance = createFromType(action.type, action.distance, action.param);
        var clone = instance.clone();
        expect(instance, action.type).to.deep.equal(clone);
      });
    });

    it('can be deleted', function() {
      var routeSheet = new RouteSheet();
      var speed = new SpeedChange(3, 30);
      routeSheet.appendAction(speed);
      expect(routeSheet.actions().length).to.equal(2);
      routeSheet.deleteAction(speed);
      expect(routeSheet.actions().length).to.equal(1);
    });

    it('cannot delete initial speed change', function() {
      var routeSheet = new RouteSheet(30);

      routeSheet.deleteAction(routeSheet.get(0));
    });

    it('cannot replace initial speed change', function() {
      var routeSheet = new RouteSheet(30);
      var replacement = new SpeedChange(3.5, 18)

      routeSheet.insertAction(replacement, 0);
    });

    it('can be inserted', function() {
      var routeSheet = new RouteSheet(30);
      routeSheet.appendAction(new SpeedChange(3, 30))

      var replacement = new SpeedChange(3, 18);
      routeSheet.insertAction(replacement, 1);
      expect(routeSheet.get(1)).to.equal(replacement);
    });

    it('can be inserted by lap', function() {
      var routeSheet = new RouteSheet(30);
      routeSheet.appendAction(new ResetTo0(20));
      routeSheet.appendAction(new SpeedChange(30, 30));
      routeSheet.insertIntoLap(new Note(20, 'hi'), 1);
      expect(routeSheet.get(1) instanceof Note).to.be.true;
    });

    it('insert respects lap lengths', function() {
      var routeSheet = new RouteSheet(30);
      routeSheet.appendAction(new ResetTo0(20));
      routeSheet.appendAction(new SpeedChange(30, 30));
      routeSheet.insertIntoLap(new Note(31, 'hi'), 1);
      expect(routeSheet.get(3) instanceof Note).to.be.true;
    });

    it('computes cumulative Reset distances', function() {
      var routeSheet = new RouteSheet(30)
      routeSheet.appendAction(new Reset(30, 40))
      expect(routeSheet.getResetDistance()).to.equal(10)
    })

    it('can have lap changed', function() {
      var routeSheet = new RouteSheet(30);
      var note = new Note(10, 'hi');
      routeSheet.appendAction(note);
      routeSheet.appendAction(new ResetTo0(20));
      routeSheet.appendAction(new SpeedChange(5, 30));
      routeSheet.appendAction(new ResetTo0(7));

      // Change to same lap shouldn't move it at all.
      routeSheet.changeLap(note, 1);
      expect(routeSheet.getIndex(note)).to.equal(1);
      expect(note.lap).to.equal(0);

      // Move to 2nd Lap (doesn't fits)
      routeSheet.changeLap(note, 2);
      expect(routeSheet.getIndex(note)).to.equal(1);
      expect(note.lap).to.equal(0);

      // Move to 2nd Lap (fits)
      note.distance = 6;
      routeSheet.changeLap(note, 2);
      expect(note.lap).to.equal(1);

      // Move to 2nd Lap (fits)
      routeSheet.changeLap(note, 3);
      expect(note.lap).to.equal(2);
    });

    it('can access lap data', function() {
      var routeSheet = new RouteSheet(60);

      routeSheet.appendAction(new Note(5, 'hi'));
      routeSheet.appendAction(new ResetTo0(10));
      routeSheet.appendAction(new Note(20, 'hi'));
      routeSheet.appendAction(new ResetTo0(30));
      routeSheet.appendAction(new Note(60, 'hi'));

      // Should be 3 laps
      var laps = routeSheet.getLaps();
      expect(laps).to.not.be.null;
      expect(laps.length).to.equal(3);
      expect(laps[0]).to.equal(10*10);
      expect(laps[1] - laps[0]).to.equal(20*10);
      expect(laps[2] - laps[1]).to.equal(30*10);
    });
  });


  describe('that is empty', function() {
    it('should have zero length', function() {
      var routeSheet = new RouteSheet();
      expect(routeSheet.getLength()).to.equal(0);
    });
  });

  describe('key time', function() {
    it('should not affect individual actions', function() {
      var routeSheet = new RouteSheet(18);
      expect(append(routeSheet, new SpeedChange(1.2, 24))).to.be.null
      expect(routeSheet.get(1).startTimeInSeconds).to.equal(4*60);
      var nineAMKey = 9 * 60 * 60;
      routeSheet.setKeyTime(nineAMKey);
      expect(routeSheet.getKeyTime()).to.equal(nineAMKey);
      expect(routeSheet.get(1).startTimeInSeconds).to.equal(4*60);
    });
  });

  describe('speed change', function() {
    it('should only be on possibles (whole minute, 1/10th of km/mile)', function() {
      var routeSheet = new RouteSheet(18)
      expect(append(routeSheet, new SpeedChange(3.1, 18))).to.not.be.null
    });


    it('should end at next speed change', function() {
      var routeSheet = new RouteSheet(15);
      expect(append(routeSheet, new Reset(4, 6))).to.be.null;
      expect(append(routeSheet, new SpeedChange(6.0, 18))).to.be.null;
      expect(routeSheet.actions().length).to.equal(3);
      expect(routeSheet.get(0).endDistanceInTenths).to.equal(60);
    });
  });

  describe('known', function() {
    it('can appear anywhere', function() {
      var routeSheet = new RouteSheet(15);
      expect(append(routeSheet, new Known(6.1/*, 6*/))).to.be.null;
    });
  });

  describe('start', function() {
    it('can appear anywhere', function() {
      var routeSheet = new RouteSheet(15);
      expect(append(routeSheet, new Start(3.59/*, 6*/))).to.be.null;
    });
  });

  describe('end', function() {
    it('should have length equal to the end point', function() {
      var routeSheet = new RouteSheet(18)
      append(routeSheet, new End(3.9))
      expect(routeSheet.getLength()).to.equal(3.9)
    });
  });

  describe('free time', function() {
    it('should be positive', function() {
      var routeSheet = new RouteSheet(30);
      expect(append(routeSheet, new SpeedChange(3.0, 6))).to.be.null;
      var freeTime = new FreeTime(0, -1);
      expect(freeTime.freeTime).to.be.greaterThan(0);
    });

    it('should move clock forward', function() {
      var routeSheet = new RouteSheet(30);
      const FREE_TIME_MIN = 10
      expect(append(routeSheet, new SpeedChange(3.0, 6))).to.be.null;
      expect(append(routeSheet, new FreeTime(3.1, FREE_TIME_MIN))).to.be.null;
      expect(routeSheet.getDuration()).to.equal(17 * 60);
      expect(append(routeSheet, new SpeedChange(3.3, 24))).to.be.null;
      expect(routeSheet.getDuration()).to.equal(19 * 60);
      expect(routeSheet.getFreeTime()).to.equal(FREE_TIME_MIN * 60)
    });

    it('should only add until the next speed change', function() {
      var routeSheet = new RouteSheet(30);
      expect(append(routeSheet, new SpeedChange(3.0, 6))).to.be.null;
      expect(append(routeSheet, new FreeTime(3.1, 10))).to.be.null;
      expect(routeSheet.getDuration()).to.equal(17 * 60);
      expect(append(routeSheet, new SpeedChange(3.3, 24))).to.be.null;
      expect(routeSheet.getDuration()).to.equal(19 * 60);
      expect(append(routeSheet, new SpeedChange(3.7, 6))).to.be.null;
      expect(routeSheet.getDuration()).to.equal(20 * 60);
    });

    it('should add multiple free times between speed changes together', function() {
      var routeSheet = new RouteSheet(30);
      expect(append(routeSheet, new SpeedChange(3.0, 6))).to.be.null;
      expect(append(routeSheet, new FreeTime(3.1, 10))).to.be.null;
      expect(routeSheet.getDuration()).to.equal(17 * 60);
      expect(append(routeSheet, new FreeTime(3.2, 10))).to.be.null;
      expect(routeSheet.getDuration()).to.equal(28 * 60);
      expect(append(routeSheet, new SpeedChange(3.3, 24))).to.be.null;
      expect(routeSheet.getDuration()).to.equal(29 * 60);
    });

    it('should sort', function() {
      var routeSheet = new RouteSheet(18)
      append(routeSheet, new Note(3.6, 'hi mom'))
      append(routeSheet, new SpeedChange(3.9, 18))

      var note = routeSheet.get(-2)
      expect(note instanceof Note).to.be.true
      note.startDistanceInTenths = 43
      routeSheet.recalc()
      note = routeSheet.get(-1)
      expect(note instanceof Note).to.be.true
    });

    it('should sort around resets to 0', function() {
      var routeSheet = new RouteSheet(18);
      append(routeSheet, new SpeedChange(3.9, 18));
      append(routeSheet, new ResetTo0(4.2));
      append(routeSheet, new Note(3.6, 'hi mom'));
      append(routeSheet, new SpeedChange(4.2, 18));

      var note = routeSheet.get(-2);
      expect(note instanceof Note).to.be.true;
      note.startDistanceInTenths = 43;
      routeSheet.recalc();
      note = routeSheet.get(-1);
      expect(note instanceof Note).to.be.true;
    });
  });

  describe('duration', function() {
    it('changes with new actions', function() {
      var routeSheet = new RouteSheet(30);
      expect(append(routeSheet, new SpeedChange(6.0, 24)), "add speed").to.be.null;
      expect(routeSheet.getDuration(), "duration").to.equal(12 * 60);
      expect(append(routeSheet, new Note(6.39, 'GAS AVAILABLE')), "adding note").to.be.null;
      expect(routeSheet.getDuration(), "duration").to.equal(12 * 60 + 59);
    });
  });

  describe('note', function() {
    it('can appear at any distance', function() {
      var routeSheet = new RouteSheet(30);
      expect(append(routeSheet, new SpeedChange(6.0, 24)), "add speed").to.be.null;
      var noteAction = new Note(6.39, 'GAS AVAILABLE');
      routeSheet.appendAction(noteAction);
      noteAction.note = 'hi mom';
      expect((routeSheet.get(-1) as Note).note).to.equal('hi mom');
      noteAction.note = null;
      expect(noteAction.note).to.not.be.null;
    });
  });

  describe('free zone', function() {
    it('should be valid anywhere', function() {
      var routeSheet = new RouteSheet(30);
      var action = new FreeZone(3.12, 3.79);
      routeSheet.appendAction(action);
      expect(action.to).to.equal(3.79);
    });

    it('should give an error if zone is negative in size.', function() {
      var routeSheet = new RouteSheet(30);
      var action = new FreeZone(3.1, 2.5);
      routeSheet.appendAction(action);
      expect(routeSheet.get(-1).distance).to.equal(3.1);
      action.to = 3.5;
      expect(action.to).to.equal(3.5);
      action.to = 2.5;
      expect(action.to).to.equal(3.5);
    });
  });

  describe('reset', function() {
    it('should be positive', function() {
      var routeSheet = new RouteSheet(18);
      expect(append(routeSheet, new SpeedChange(1.2, 24))).to.be.null;
      append(routeSheet, new Reset(1.4, 1.2));
      expect(routeSheet.get(-1).distance).to.equal(1.4);
      expect(append(routeSheet, new Reset(1.4, 1.4))).to.be.null;
      expect(append(routeSheet, new Reset(1.4, 1.5))).to.be.null;
      expect(routeSheet.getLength()).to.equal(1.5);
    });

    it('should extend route length but not ground', function() {
      var routeSheet = new RouteSheet(18);
      expect(append(routeSheet, new SpeedChange(1.2, 24))).to.be.null;
      expect(append(routeSheet, new Reset(1.4, 1.5))).to.be.null;
      expect(routeSheet.getGroundDistance()).to.equal(1.4);
      expect(routeSheet.getLength()).to.equal(1.5);
    });
  });

  describe('reset to 0', function() {
    it('should create multiple laps', function() {
      // Lap 1
      var routeSheet = new RouteSheet(18);

      // Lap 2
      expect(append(routeSheet, new ResetTo0(3.3))).to.be.null;
      expect(append(routeSheet, new SpeedChange(0.3, 24))).to.be.null;
      expect(routeSheet.getLength()).to.equal(3.6);
      expect(routeSheet.get(0).endDistanceInTenths).to.equal(3);
      expect(routeSheet.get(0).lap).to.equal(0);
      expect(routeSheet.get(2).lap).to.equal(1);

      // Lap 3
      expect(append(routeSheet, new ResetTo0(0.7))).to.be.null;
      expect(append(routeSheet, new SpeedChange(0.4, 18))).to.be.null;
    });

    it('should be on possibles (Troy made this rule up but it sticks)', function() {
      var routeSheet = new RouteSheet(18);
      expect(append(routeSheet, new ResetTo0(3.2))).to.not.be.null;
    });
  });

  describe('gas stop', function() {
    it('can appear at any distance', function() {
      var routeSheet = new RouteSheet(30);
      expect(append(routeSheet, new SpeedChange(6.0, 24)), "speed change").to.be.null;
      expect(routeSheet.getDuration(), "duration").to.equal(12 * 60);
      expect(append(routeSheet, new GasStop(6.39)), "gas stop").to.be.null;
      expect(routeSheet.getDuration(), "duration").to.equal(12 * 60 + 59);
    });
  });
});
