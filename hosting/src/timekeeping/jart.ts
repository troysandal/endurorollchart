import {getMinimum, MinimumPossible} from './possibles'
import Util from './util';
import {
  SpeedChange, FreeTime, ResetTo0, Action, FreeZone,
  Start, GasStop, Note, Known, Reset } from './actions';
import RouteSheet from './routesheet';
import Enduro from './enduro'
const round10 = Util.round10;

/**
 * This class could be more aptly named JARTGenerator. Given an Enduro it will
 * turn it into an array of JART rows which are just Action rows with a new 
 * type, 'possible' that has the boolean `isPossible` set to `true`.
 */
export default class JART {
  rows:any[] = [];
  zones:any[] = [];

  /*
   Generates a JART in 2 passes. First pass writes every action and all
   possibles that aren't redundant with speed changes.  The output of the first
   pass is an array of JART rows and the exclusion zones generated from the
   route sheet actions.  Pass 2 removes all possible rows from the JART array
   that are within an exclusion zone.
   */
  createFromEnduro(enduro:Enduro, useZeroStartMinute:boolean = false): any[] {
    // Pass 1 - Writes every action and all possibles that aren't redundant with
    // speed changes.  The output of the first pass is an array of JART rows and
    // the exclusion zones generated from the route sheet actions.  
    this.generateRows(enduro);

    // Pass 2 - Remove all possible rows from the JART array that are within an
    // exclusion zone or, optionally, do not meet the minimum course speed where 
    // Secret checkpoints can be place.
    let minSecretSpeed:number = 0;

    if (enduro.routeSheet.options?.useSecretMinSpeed) {
      minSecretSpeed = enduro.routeSheet.options.secretMinSpeed ?? 0;
    }

    this.removePossibles(minSecretSpeed);

    // By default we use the key time's minute for the JART chart. But if you're
    // using an ICO computer and still want a JART with you you'll want the 
    // minute to start with 00 to match it's screen.
    if (!useZeroStartMinute) {
      this.adjustMinuteForKeyTime(enduro.routeSheet);
    }

    return this.rows;
  }

  adjustMinuteForKeyTime(routeSheet) {
    var keyTimeMinutes = (routeSheet.getKeyTime() / 60) % 60;

    if (keyTimeMinutes !== 0) {
      this.rows.forEach(function(row) {
        if (row.hasOwnProperty('minute')) {
          row.minute += keyTimeMinutes;
          row.minute = row.minute % 60;
        }
      });
    }
  }

  generatePossibles(action:Action, speed:number, minPossible, fromTenths, fromMinute, toTenths) {
    var result:any[] = [];

    var nextPossibleDistance = fromTenths;
    var nextPossibleMinute = fromMinute;

    while (nextPossibleDistance <= toTenths) {
      var possible = {
        lap: action.lap,
        type: 'possible',
        startTimeInSeconds : nextPossibleMinute * 60,
        minute: nextPossibleMinute % 60,
        startDistance: nextPossibleDistance,
        speed: speed,
        isPossible: true
      };

      result.push(possible);

      nextPossibleDistance += round10(minPossible.distance * 10, -1);
      nextPossibleMinute += minPossible.minutes;
    }

    return result;
  }

  generateRows(enduro:Enduro) {
    const routeSheet:RouteSheet = enduro.routeSheet
    // Pass 1 - Generate JART & exclusion zones
    let lastSpeedChange:SpeedChange = <SpeedChange>routeSheet.get(0);
    let nextPossibleDistance = 0;
    let nextPossibleMinute = 0;
    let minPossible:MinimumPossible = getMinimum(lastSpeedChange.speed);
    let outer = this;

    this.rows.push({
      type: 'title',
      title: enduro.title
    });

    routeSheet.actions().forEach(function(action:Action, index) {
      let row = outer.initializeRow(action, lastSpeedChange, index);

      let possibles = outer.generatePossibles(
        action,
        lastSpeedChange.speed,
        minPossible,
        nextPossibleDistance,
        nextPossibleMinute,
        row.startDistance)

      let lastPossible = possibles[possibles.length - 1];

      if (lastPossible) {
        nextPossibleDistance = lastPossible.startDistance;
        nextPossibleDistance += round10(minPossible.distance * 10, -1);
        nextPossibleMinute = lastPossible.minute;
        nextPossibleMinute += minPossible.minutes;

        // Don't push possible when it matches a new speed change, redundant.
        if (action instanceof SpeedChange && action.startDistanceInTenths === lastPossible.startDistance) {
          possibles.pop();
        }
      }

      outer.rows = outer.rows.concat(possibles);
      outer.rows.push(row);

      // Update Possibles depending on action type.
      if (action instanceof SpeedChange) {
        lastSpeedChange = action;
        minPossible = getMinimum(lastSpeedChange.speed);
        nextPossibleDistance = row.startDistance;
        nextPossibleMinute = row.minute;
        nextPossibleDistance += round10(minPossible.distance * 10, -1);
        nextPossibleMinute += minPossible.minutes;
      }
      else if (action instanceof FreeTime) {
        var backedUpPossible = nextPossibleDistance - round10(minPossible.distance * 10, -1);
        if (backedUpPossible >= action.startDistanceInTenths) {
          nextPossibleDistance -= round10(minPossible.distance * 10, -1);
          nextPossibleMinute -= minPossible.minutes;
        }

        nextPossibleMinute += row.seconds / 60;
      }
      else if (action instanceof ResetTo0) {
        nextPossibleDistance = minPossible.distance * 10;
      }
    });
  }

  removePossibles(secretMinSpeed: number) {
    const outer = this;
    this.rows = this.rows.filter(function(row) {
      let keepInList = true;
      if (row.isPossible) {
        keepInList = !outer.isRowInFreeZone(row);
        // D36 Rule 11.2.7.10 Secret checks may not be used at a speed average
        // of 6 mph or less.
        keepInList = keepInList && (row.speed > secretMinSpeed);
      }
      return keepInList;
    });
  }

  initializeRow(action:Action, lastSpeedChange:SpeedChange, index) {
    var row = {
      type: action.type,
      startTimeInSeconds : action.startTimeInSeconds,
      lap: action.lap,
      minute: Math.round(action.startTimeInSeconds / 60) % 60,
      startDistance: action.startDistanceInTenths,
      speed: lastSpeedChange.speed,
      seconds: 0,
      isPossible: false
    };

    var init_method = this['init_' + action.type] || function() { };
    init_method.call(this, row, action, index);

    return row;
  }

  init_speedChange(row, action:SpeedChange, index) {
    row.speed = action.speed;
    if (index === 0) {
      this.zones.push({lap: action.lap, min: 0, max: 30});
    }
  }

  init_freeZone(row, action:FreeZone) {
    row.freeTo = action.endDistanceInTenths;
    this.zones.push({
      lap: action.lap,
      min: action.startDistanceInTenths,
      max: action.endDistanceInTenths
    });
  }

  init_start(_row, action:Start) {
    this.zones.push({
      lap: action.lap,
      min: action.startDistanceInTenths,
      max: action.startDistanceInTenths + 30
    });
  }

  init_known(_row, action:Known) {
    this.zones.push({
      lap: action.lap,
      min: action.startDistanceInTenths - 30,
      max: action.startDistanceInTenths + 30
    });
  }

  init_gasStop(_row, action:GasStop) {
    this.zones.push({
      lap: action.lap,
      min: action.startDistanceInTenths - 20,
      max: action.startDistanceInTenths + 30
    });
  }

  init_reset(row, action:Reset) {
    row.resetTo = action.endDistanceInTenths;
    this.zones.push({
      lap: action.lap,
      min: action.startDistanceInTenths,
      max: action.endDistanceInTenths
    });
  }

  init_freeTime(row, action:FreeTime) {
    row.seconds = action.freeTimeInSeconds();
  }

  init_note(row, action:Note) {
    row.note = action.note;
  }

  isRowInFreeZone(row) {
    return this.zones.find(function(zone) {
      var result =
        zone.lap === row.lap &&
        (zone.min < row.startDistance) && (row.startDistance < zone.max);

      return result;
    });
  }
}
