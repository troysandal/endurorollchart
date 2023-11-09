import Util from './util';
const round10 = Util.round10;

/**
 * Our own internal names for each action type.  These are NOT to be changed
 * as they are considered a persistable name.  This means they are safe to
 * use in CSS class names or in our JSON file format.  It also provides an
 * alternative to instanceOf.
 */
export enum ActionType {
  SpeedChange = 'speedChange',
  Reset       = 'reset',
  ResetToZero = 'resetToZero',
  FreeTime    = 'freeTime',
  FreeZone    = 'freeZone',
  GasStop     = 'gasStop',
  Known       = 'known',
  Note        = 'note',
  Start       = 'start',
  End         = 'end'
}

/**
  Base class for all route sheet actions.  Time is stored
  as # of seconds since race start.  This allows key time to change without
  us having to recalculate the route sheet.  Mileage is in 10ths to allow
  for integer math, avoiding most float accuracy issues.  As of this
  writing I wish I'd used hundredths however as we do support fractional
  tenths but we don't ensure accuracy to hundreths across different browser
  float libraries.

  Note we use the word distance in lieu of mileage to keep keep us agnostic
  of miles vs kilometers.  You should be able to use either.

  Every route is an array of actions, every action having a distance, type
  and an optional parameter, e.g. speed, note, freetime, etc.  The optional
  parameter, if any, is defined in a derived classes, e.g. SpeedChange or Note.
  Given an array of Actions with these 2-3 parameters we can calucuate the full
  route sheet and from that a JART chart.

  TODO Switch to 100ths???
  TODO Refactor Action to be an interface?  This class is so overkill, an
        action is just a type, distance and optional param who's type is
        defined by the action type.  We've added the lap, to/end, etc as well
        which are all computed values for the routesheet and some for the JART
        which has it's own values.  Your model can be greatly cleaned up here.
*/
export abstract class Action {
  abstract get type():ActionType
  startDistanceInTenths:number;

  // computed values
  lap:number = -1;
  toDistanceInTenths:number;
  endDistanceInTenths:number;
  distanceToGoInTenths:number;
  startTimeInSeconds:number;
  endTimeInSeconds:number;

  error: string|null = null;

  constructor(distance) {
    this.startDistanceInTenths = Util.round10(distance * 10, -1);
    this.lap = -1;
    this.toDistanceInTenths = round10(distance * 10, -1);
    this.endDistanceInTenths = round10(distance * 10, -1);
    this.distanceToGoInTenths = 0;
    this.startTimeInSeconds = 0;
    this.endTimeInSeconds = 0;
  }

  public get distance():number {
    return this.startDistanceInTenths / 10;
  }

  public set distance(distance:number) {
    this.startDistanceInTenths = round10(distance * 10, -1);
  }

  clone() {
    const clone:Action = new (this.constructor as any)(this.startDistanceInTenths);
    clone.copy(this);
    return clone;
  }

  copy(other:Action) {
    this.startDistanceInTenths = other.startDistanceInTenths;
    this.lap = other.lap;
    this.toDistanceInTenths = other.toDistanceInTenths;
    this.endDistanceInTenths = other.endDistanceInTenths;
    this.distanceToGoInTenths = other.distanceToGoInTenths;
    this.startTimeInSeconds = other.startTimeInSeconds;
    this.endTimeInSeconds = other.endTimeInSeconds;
  }
}


export class SpeedChange extends Action {
  get type():ActionType { return ActionType.SpeedChange }
  private _speed: number = 0;

  constructor(distance:number, speed:number) {
    super(distance)
    this.speed = speed || 18
  }

  get speed():number {
    return this._speed;
  }

  set speed(speed:number) {
    if (speed < 1) {
      speed = this._speed || 18;
    }
    this._speed = Math.round(speed);
  }

  copy(other) {
    super.copy(other);
    this._speed = other._speed;
  }
}

export class Known extends Action {
  get type():ActionType { return ActionType.Known }
  constructor(distance) {
    super(distance);
  }
}


export class Start extends Action {
  get type():ActionType { return ActionType.Start }
  constructor(distance) {
    super(distance);
  }
}


export class End extends Action {
  get type():ActionType { return ActionType.End }
  constructor(distance) {
    super(distance);
  }
}


export class FreeTime extends Action {
  get type():ActionType { return ActionType.FreeTime }
  _seconds:number = 0;

  constructor(distance, minutes:number = 5) {
    super(distance);
    this.freeTime = minutes || 5;
  }

  set freeTime(minutes:number) {
    if (minutes < 1) {
      minutes = (this._seconds / 60) || 5;
    }
    minutes = Math.round(minutes);
    this._seconds = minutes * 60;
  }

  get freeTime():number {
    return this._seconds / 60;
  }

  freeTimeInSeconds() {
    return this._seconds;
  }

  copy(other) {
    Action.prototype.copy.call(this, other);
    this._seconds = other._seconds;
  }
}


export class Note extends Action {
  get type():ActionType { return ActionType.Note }
  private _note: string|null = null;

  constructor(distance, note) {
    super(distance);
    this.note = note;
  }

  get note(): string|null {
    return this._note;
  }
  set note(note:string|null) {
    this._note = note || '';
  }

  copy(other) {
    Action.prototype.copy.call(this, other);
    this._note = other._note;
  }
}


/**
 * Used by both FreeZone and Rests for the to distance getter/setter.
 */
abstract class FreeResetBase extends Action {
  constructor(distance) {
    super(distance)
  }

  set to(toDistance:number) {
    if (toDistance < this.distance) {
      if (this.toDistanceInTenths) {
        toDistance = round10(this.toDistanceInTenths / 10, -1)
      }
      else {
        toDistance = this.distance;
      }
    }

    this.toDistanceInTenths = round10(toDistance * 10, -1);
    this.endDistanceInTenths = round10(toDistance * 10, -1);
    this.distanceToGoInTenths = round10(this.toDistanceInTenths - this.startDistanceInTenths, -1);
  }
  get to():number {
    return round10(this.toDistanceInTenths / 10, -2);
  }

  set distance(distance:number) {
    super.distance = distance
    this.distanceToGoInTenths = round10(this.toDistanceInTenths - this.startDistanceInTenths, -1);
  }

  get distance():number {
    return super.distance
  }
}


export class FreeZone extends FreeResetBase {
  get type():ActionType { return ActionType.FreeZone }

  constructor(distance:number, toDistance:number) {
    super(distance);
    this.to = toDistance || distance;
  }
}


export class Reset extends FreeResetBase {
  get type():ActionType { return ActionType.Reset }

  constructor(distance:number, toDistance:number) {
    super(distance);
    this.to = toDistance;
  }
}


export class ResetTo0 extends Action {
  get type():ActionType { return ActionType.ResetToZero }

  constructor(distance) {
    super(distance);
  }
}


export class GasStop extends Action {
  get type():ActionType { return ActionType.GasStop }

  constructor(distance) {
    super(distance);
  }
}

export function createActionFromType(typeName: ActionType, distance: number) {
  const FROM_RS_MAP = new Map<string, any>(  [
      [ActionType.SpeedChange, SpeedChange],
      [ActionType.Reset, Reset],
      [ActionType.ResetToZero, ResetTo0],
      [ActionType.FreeTime, FreeTime],
      [ActionType.FreeZone, FreeZone],
      [ActionType.GasStop, GasStop],
      [ActionType.Known, Known],
      [ActionType.Note, Note],
      [ActionType.Start, Start],
      [ActionType.End, End]
      ]
  )
  const ctor = FROM_RS_MAP.get(typeName)
  console.assert(ctor, `Unknown ActionTyype ${typeName}`)
  return new ctor(distance)
}
