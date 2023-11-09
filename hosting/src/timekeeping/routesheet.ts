import {
  SpeedChange, Reset, ResetTo0,
  GasStop, Known, Note, Start, End,
  FreeTime, FreeZone, Action
} from './actions';
import {default as Util, EventDispatcher} from './util';
import {getMinimum, MinimumPossible} from './possibles';

function secondsForDuration(SPEED_DATA, deltaDistance) {
  var distanceUnits = deltaDistance / (SPEED_DATA.distance * 10);
  return Math.round((SPEED_DATA.minutes * distanceUnits) * 60);
}

export interface RouteSheetOptions {
  secretMinSpeed?: number,
  useSecretMinSpeed?: boolean
}

class RouteSheet extends EventDispatcher {
  private _actions:Action[] = [];
  private _keyTimeInSecondsSinceMidnight: number;
  private _resetsInTenths: number;
  private _lapLengthsInTenths:number[] = [];
  options: RouteSheetOptions = {}

  constructor(initialSpeed:number = 18) {
    super()
    this._actions = [];
    this._keyTimeInSecondsSinceMidnight = 8 * 60 * 60;
    this._resetsInTenths = 0;
    this._lapLengthsInTenths = [];   // Cumulative lengths, not individual

    // Initial speed change
    var newAction = new SpeedChange(0, initialSpeed);
    this.appendAction(newAction);
  }


  getKeyTime() {
    return this._keyTimeInSecondsSinceMidnight;
  }
  setKeyTime(newKeyTimeInSeconds:number) {
    if (newKeyTimeInSeconds !== this._keyTimeInSecondsSinceMidnight) {
      this._keyTimeInSecondsSinceMidnight = newKeyTimeInSeconds;
      this.dispatch({name: 'recalc'});
    }
  }

  getFreeTime() {
    return this._actions
      .filter<FreeTime>((v):v is FreeTime => v instanceof FreeTime)
      .map((freeTime) => freeTime.freeTimeInSeconds())
      .reduce((p, v) => p + v, 0)
  }

  // Route length including resets in 1/10ths.
  private _getLengthInTenths() {
    return this._lapLengthsInTenths.reduce((p, v) => p + v, 0);
  }

  // Route length including resets, in whole unit (not 1/10ths).
  getLength() {
    return this._getLengthInTenths() / 10;
  }

  // Route length NOT including resets, in whole unit (not 1/10ths).
  getGroundDistance() {
    return (this._getLengthInTenths() - this._resetsInTenths) / 10;
  }

  getResetDistance() {
    return this._resetsInTenths / 10;
  }

  getDuration() {
    return this._actions[this._actions.length - 1].endTimeInSeconds;
  }

  getLaps() {
    return this._lapLengthsInTenths;
  }

  /**
   Returns true if the action's distance is on a possible as defined by
   it's previous speed change.
   */
  actionDistanceMatchesRouteSpeed(action:Action, index:number) {
    const speedChanges = this._actions.filter<SpeedChange>(function(v, i): v is SpeedChange {
      return v instanceof SpeedChange && i < index;
    });
    const lastSpeedChange:SpeedChange = speedChanges.pop() as SpeedChange;
    const minPossible:MinimumPossible = getMinimum(lastSpeedChange.speed);
    const deltaDistance = this.distanceToLastSpeedChange(action, lastSpeedChange, true);
    const distanceUnits = deltaDistance / (minPossible.distance * 10);

    return (distanceUnits % 1 === 0) && (deltaDistance >= 0);
  }

  /**
   Computes the distance from an action to a previous speed change by taking
   into account any laps between them.
   */
  distanceToLastSpeedChange(action:Action, lastSpeedChange:SpeedChange, noRound = false) {
    let result;

    if (action.lap === lastSpeedChange.lap) {
      // Same lap means we can just subtract their distances.
      result = action.startDistanceInTenths - lastSpeedChange.startDistanceInTenths;
    }
    else {
      // This action is on a later lap than the speed change so we sum...

      // 1 - The distance from action to start of it's own lap
      result = action.startDistanceInTenths;

      // 2 - The length of every lap in between the two actions, if any
      for (var lap = (lastSpeedChange.lap + 1) ; lap <= (action.lap - 1) ; lap++) {
          result += this._lapLengthsInTenths[lap];
      }

      // 3 - The distance from the speed change to the end of its lap
      result += this._lapLengthsInTenths[lastSpeedChange.lap] - lastSpeedChange.startDistanceInTenths;
    }

    if (!noRound) {
      result = Util.round10(result, -1);
    }

    return result;
  }

  /**
   Computes the full route sheet details from each action's canonical data.
   */
  recalc() {
    let lastSpeedChange:SpeedChange = this._actions[0] as SpeedChange;
    var totalResetsInTenths = 0;
    var freeTimeAccumulated = 0;
    this._lapLengthsInTenths = [0];
    var outer = this;

    this.sort();

    this._actions.forEach(function(action) {
      action.lap = outer._lapLengthsInTenths.length - 1;

      var minPossible:MinimumPossible = getMinimum(lastSpeedChange.speed);
      var deltaDistance = outer.distanceToLastSpeedChange(action, lastSpeedChange);
      var deltaSeconds = secondsForDuration(minPossible, deltaDistance);

      var newActionSeconds = lastSpeedChange.startTimeInSeconds +
                             deltaSeconds + freeTimeAccumulated;

      if (action instanceof SpeedChange) {
        // These are niceties for incomplete speed changes (no end)
        action.distanceToGoInTenths = 0;
        action.endDistanceInTenths = action.startDistanceInTenths;

        action.startTimeInSeconds = newActionSeconds;
        action.endTimeInSeconds = action.startTimeInSeconds;
      }
      else if (action instanceof End || action instanceof Known || action instanceof Start) {
        action.startTimeInSeconds = newActionSeconds;
        action.endTimeInSeconds = action.startTimeInSeconds;
        action.endDistanceInTenths = action.startDistanceInTenths;
      }
      else if (action instanceof FreeTime) {
        action.startTimeInSeconds = newActionSeconds;
        action.endTimeInSeconds = action.startTimeInSeconds;

        action.endTimeInSeconds += action.freeTimeInSeconds();
        action.endDistanceInTenths = action.startDistanceInTenths;

        freeTimeAccumulated += action.freeTimeInSeconds();
      }
      else if (action instanceof Note || action instanceof GasStop) {
        action.startTimeInSeconds = newActionSeconds;
        action.endTimeInSeconds = action.startTimeInSeconds;
      }
      else if (action instanceof FreeZone) {
        action.startTimeInSeconds = newActionSeconds;
        action.endTimeInSeconds =
          action.startTimeInSeconds +
          secondsForDuration(minPossible, action.distanceToGoInTenths);
      }
      else if (action instanceof Reset) {
        action.startTimeInSeconds = newActionSeconds;
        action.endTimeInSeconds =
          action.startTimeInSeconds +
          secondsForDuration(minPossible, action.distanceToGoInTenths);
        totalResetsInTenths += action.distanceToGoInTenths;
      }
      else if (action instanceof ResetTo0) {
        action.startTimeInSeconds = newActionSeconds;
        action.endTimeInSeconds = action.startTimeInSeconds;

        outer._lapLengthsInTenths[outer._lapLengthsInTenths.length - 1] = action.startDistanceInTenths;
        outer._lapLengthsInTenths.push(0);
      }

      // Back propogate time and distance to last speed change.
      lastSpeedChange.distanceToGoInTenths = deltaDistance;
      lastSpeedChange.endTimeInSeconds = action.startTimeInSeconds;
      lastSpeedChange.endDistanceInTenths = action.startDistanceInTenths;

      if (action instanceof SpeedChange) {
        lastSpeedChange = action;
        freeTimeAccumulated = 0;
      }

      outer._lapLengthsInTenths[action.lap] = action.endDistanceInTenths
    });

    this._resetsInTenths = totalResetsInTenths;
    this.checkForErrors();

    this.dispatch({name: 'recalc'});
}

  /**
   * Sorts the actions by mileage.  These can get out of order during
   * editing which is valid, this method puts them back in order within
   * a given lap (defined by resets to 0).
   */
  sort() {
    var laps:Action[][] = [];
    var lastReset = 0;

    this._actions.forEach(function(action:Action, index, actions) {
      if (action instanceof ResetTo0) {
        laps.push(actions.slice(lastReset, index + 1));
        lastReset = index + 1;
      } else if (index === actions.length - 1) {
        laps.push(actions.slice(lastReset, index + 1));
      }
    });

    var newActions:Action[] = [];

    laps.forEach(function(lap) {
      lap = Util.mergeSort(lap, function(action1:Action, action2:Action) {
        return action1.startDistanceInTenths - action2.startDistanceInTenths;
      });
      newActions = newActions.concat(lap);
    });

    // Fire 'reindex' event if the order of any actions changed.
    const oldActions = this._actions;
    this._actions = newActions;

    const reindex = this._actions.find(function(action, index) {
      if (action !== oldActions[index]) {
        return true;
      }
    });

    if (reindex) {
      this.dispatch({name: 'reindex'});
    }
  }

  /**
    Walks the route sheet and generates a list of errors if any action
    appears invalid, e.g. speed change not on a minute, 10th.
  */
  checkForErrors() {
    var outer = this;

    this._actions.forEach(function(action, index) {
      var error:string|null = null;
      const distance = (action.startDistanceInTenths / 10).toFixed(2);
      const lap = action.lap + 1;

      if (action instanceof SpeedChange && index > 0) {
        if (!outer.actionDistanceMatchesRouteSpeed(action, index)) {
          error = `Loop ${lap} Speed change @ ${distance} not on possible.`;
        }
      }
      else if (action instanceof FreeTime) {
        var validAction = (action.freeTime >= 0);
        if (!validAction) {
          error = `Loop ${lap} Free Time @ ${distance} minutes must be >= 0.`;
        }
      }
      else if (action instanceof FreeZone) {
        var validAction = action.toDistanceInTenths >= action.startDistanceInTenths;
        if (!validAction) {
          error = `Loop ${lap} Free Zone @ ${distance} toDistance must be greater than distance.`;
        }
      }
      else if (action instanceof Reset) {
        var validAction = action.toDistanceInTenths >= action.startDistanceInTenths;
        if (!validAction) {
          error = `Loop ${lap} Reset @ ${distance} toDistance must be greater than distance.`;
        }
      }
      else if (action instanceof ResetTo0) {
        // Resets to zero must be on a possible because the new lap inherits
        // inherits the current speed change which, by definition, is always
        // on a whole 1/10th and minute, thus the reset must be as well.
        if (!outer.actionDistanceMatchesRouteSpeed(action, index)) {
          error = `Loop ${lap} Reset to 0 @ ${distance} not on possible.`;
        }
      }

      action.error = error;
    });
  }

  get(index):Action {
    if (index < 0) {
      return this._actions[this._actions.length - -index];
    }
    return this._actions[index];
  }

  getIndex(action:Action):number {
    return this._actions.indexOf(action);
  }

  actions():Action[] {
    return this._actions;
  }

  deleteAction(action:Action) {
    var index = this._actions.indexOf(action);
    if (index > 0) {
      this._actions.splice(index, 1);
      this.dispatch({
        name: 'delete',
        action: action,
        index: index
      })
      this.recalc();
    }
  }

  appendAction(action:Action) {
    this.insertAction(action, this._actions.length);
  }

  // Note that inserts by index aren't guarnateed to be stable as
  // the inserted action may sort into a different position from
  // its mileage.
  insertAction(action:Action, index:number, mutation: boolean = false) {
    console.assert(action, 'must specify an action');
    console.assert(this.getIndex(action) === -1, 'action already in route sheet')

    if ((index > 0 || this._actions.length === 0) && index <= this._actions.length) {
      this._actions.splice(index, 0, action);
      this.dispatch({
        name: 'insert',
        action: action,
        index: index,
        mutation: mutation
      });
      this.recalc();
    }
  }

  /**
   * Moves to a new lap, if possible.  Only succeeds if the action fits inside
   * the lap, if not it's left in its current place.
   *
   * @param action Action to insert.
   * @param lap    1-based lap index.
   */
  changeLap(action:Action, lap:number) {
    var actionIndex = this.getIndex(action);
    console.assert(action, 'must specify an action');
    console.assert(actionIndex !== -1, 'action should in route sheet')
    console.assert(typeof lap === 'number', 'invalid lap ' + lap);

    // Clamp it from 1 to # laps
    lap = Math.max(1, Math.min(lap, this._lapLengthsInTenths.length));

    const lapLength = this._lapLengthsInTenths[lap - 1];
    let insertIndex = -1;

    if (action.lap === (lap - 1)) {
      return;
    }
    else if (this._lapLengthsInTenths.length === lap) {
      this._actions.splice(actionIndex, 1);
      this._actions.push(action);
    }
    else if (action.startDistanceInTenths <= lapLength) {
      this._actions.splice(actionIndex, 1);
      var all0s = this._actions.filter(function(action) {
        if (action instanceof ResetTo0) {
          return action;
        }
      });
      var resetTo0 = all0s[lap - 1];
      insertIndex = this.getIndex(resetTo0);
      this._actions.splice(insertIndex, 0, action);
    }

    this.recalc();
  }

  /**
   * Inserts an action inside a given lap.  Only succeeds if the lap fits inside the
   * lap, if not it's appended to the end of the route.
   *
   * @param action Action to insert.
   * @param lap    1-based lap index.
   */
  insertIntoLap(action:Action, lap) {
    console.assert(action, 'must specify an action');
    console.assert(this.getIndex(action) === -1, 'action already in route sheet')
    console.assert(typeof lap === 'number', 'invalid lap ' + lap);

    // Clamp it from 1 to # laps
    lap = Math.max(1, Math.min(lap, this._lapLengthsInTenths.length));

    var lapLength = this._lapLengthsInTenths[lap - 1];
    var insertIndex = -1;

    if (this._lapLengthsInTenths.length === lap || action.startDistanceInTenths > lapLength) {
      this.appendAction(action);
      insertIndex = this._actions.length - 1;
    }
    else {
      var all0s = this._actions.filter(function(action) {
        if (action instanceof ResetTo0) {
          return action;
        }
      });
      var resetTo0 = all0s[lap - 1];
      insertIndex = this.getIndex(resetTo0);
      this._actions.splice(insertIndex, 0, action);
    }

    this.dispatch({
      name: 'insert',
      action: action,
      index: this.getIndex(action)
    });
    this.recalc();
  }
};

export default RouteSheet;
