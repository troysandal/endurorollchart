/*
 * Serializers to/from JSON and the RS file format defined by Enduro Computer 3.1.
 * Field names and constants in this file are serialized so don't change
 * any names without understand the consequences as you may break existing
 * files.
 */
import {
  SpeedChange, Reset, ResetTo0,
  GasStop, Known, Note, Start, End,
  FreeTime, FreeZone, ActionType
} from './actions';
import Util from './util';
import RouteSheet from './routesheet'
import Enduro from './enduro'
const debug = console.log

/**
 * Maps action types to Enduro Computer *.rs file action names and Route Sheet
 * txt file action names.
 */
export const RS_MAP =
{
  [ActionType.SpeedChange]: { txt: "Speed" ,      rs: "speed"     ,v1: "speed"},
  [ActionType.Reset]:       { txt: "Reset To" ,   rs: "reset"     ,v1: "reset"},
  [ActionType.ResetToZero]: { txt: "Reset to 0" , rs: "reset_0"   ,v1: "resetTo0"},
  [ActionType.FreeTime]:    { txt: "Free Time" ,  rs: "free_time" ,v1: "freeTime"},
  [ActionType.FreeZone]:    { txt: "Free to",     rs: "free_zone" ,v1: "freeZone"},
  'break':                  { txt: "Break",       rs: "break"     ,v1: "break"},
  [ActionType.GasStop]:     { txt: "Gas Stop",    rs: "gas_stop"  ,v1: "gasStop"},
  [ActionType.Known]:       { txt: "Known",       rs: "known"     ,v1: "known"},
  [ActionType.Note]:        { txt: "Note",        rs: "note"      ,v1: "note"},
  [ActionType.Start]:       { txt: "Start",       rs: "start"     ,v1: "start"},
  [ActionType.End]:         { txt: "End",         rs: "end"       ,v1: "end" }
}

const FROM_RS_MAP = new Map<string, any>(
  [
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

const TO_RS_MAP = new Map<any, string>()
for (let item of FROM_RS_MAP) {
  TO_RS_MAP.set(item[1], item[0])
}

/**
 * Converst an Enduro to the Enduro Computer 3.1 RS file format.
 *
 * @param enduro Enduro you're converting.
 * @return String containing RS file representation of Enduro.
 */
export function toRS(enduro:Enduro):string {
  // Phase 1 - convert to rows with up to 3 columns [type, mileage[, param]]
  const rows:string[][] = [
    ['# Enduro Route Sheet']
  ]
  let row

  const titles = enduro.title.split('\n');
  titles.forEach(function(title, index) {
    row = [`title${index ? index + 1 : ''}`, title]
    rows.push(row)
  });

  const routeSheet:RouteSheet = enduro.routeSheet

  // keytime
  rows.push(['keytime', Util.keyTimeNoSeconds(routeSheet.getKeyTime())])

  const handlers = {
    [ActionType.SpeedChange]: (action:SpeedChange) => action.speed,
    [ActionType.Reset]: (action:Reset) => Util.distance2String(action.toDistanceInTenths),
    [ActionType.FreeTime]: (action:FreeTime) => action.freeTime,
    [ActionType.Note]: (action:Note) => action.note,
    [ActionType.FreeZone]: (action:FreeZone) => Util.distance2String(action.toDistanceInTenths)
  }

  for (const action of routeSheet.actions()) {
    row = [RS_MAP[action.type].rs, action.distance.toFixed(2)]
    const handler = handlers[action.type]
    if (handler) {
      const param = handler(action)
      row.push(param)
    }
    rows.push(row)
  }

  // Phase 2 - convert rows/columns to formatted rows
  function padStart(str, n){
    if (String(str).length < n) {
      return `${Array(n - String(str).length + 1).join(' ')}${str}`
    }
    return str
  }

  type PadFunction = (s: string) => string;
  const pads: PadFunction[] = [
    (s) => padStart(s, 10),
    (s) => padStart(s, 6), (s) => ` ${s}`
  ]

  const lines:string[] = []
  for (const row of rows) {
    const cells:string[] = []
    for (const ix in row) {
      const columnValue:string = String(row[ix])
      const cell = pads[ix](columnValue)
      cells.push(cell)
    }
    const line = cells.join(' ')
    lines.push(line)
    debug(line)
  }
  lines.push('')
  const result = lines.join('\n')
  return result
}

/**
 * Converts an Enduro Computer 3.1 *.rs file into an Enduro.
 * 
 * @param rsFile String containing RS file.
 */
export function fromRS(rsFile:string):Enduro {
  // TODO - Detect keytime and initial speed, if not return null
  let firstSpeed = true;
  const enduro = new Enduro()
  const routeSheet = enduro.routeSheet
  const lines = rsFile.split('\n')

  for (let line of lines) {
    line = line.trim();
    const columns = line.match(/\S+/g) || [];
    const action = (columns || [])[0] || '';
    const distance = parseFloat(columns[1])

    if (action.match(/^title([1-3])?$/g)) {
      const title = (columns.slice(1) || ['']).join(' ');
      let currentTitle = enduro.title;
      if (currentTitle.length) {
        currentTitle += '\n';
      }
      currentTitle += title || "";
      enduro.title = currentTitle;
    }
    else if (action === 'keytime') {
      const keyTimeStrings = columns[1].split(':');
      const keyTime:number[] = []
      keyTime[0] = parseInt(keyTimeStrings[0], 10);
      keyTime[1] = parseInt(keyTimeStrings[1], 10);
      const secondsSinceMidnight = ((keyTime[0] * 60) + keyTime[1]) * 60;
      routeSheet.setKeyTime(secondsSinceMidnight);
    }
    else if (action === RS_MAP.speedChange.rs) {
      const speed = parseFloat(columns[2]);
      if (firstSpeed) {
        firstSpeed = false;
        (routeSheet.get(0) as SpeedChange).speed = speed;
      }
      else {
        routeSheet.appendAction(new SpeedChange(distance, speed))
      }
    }
    else if (action === RS_MAP.freeZone.rs) {
      const toDistance = parseFloat(columns[2]);
      routeSheet.appendAction(new FreeZone(distance, toDistance))
    }
    else if (action === RS_MAP.reset.rs) {
      const toDistance = parseFloat(columns[2]);
      routeSheet.appendAction(new Reset(distance, toDistance))
    }
    else if (action === RS_MAP.resetToZero.rs) {
      routeSheet.appendAction(new ResetTo0(distance))
    }
    else if (action === RS_MAP.known.rs) {
      routeSheet.appendAction(new Known(distance))
    }
    else if (action === RS_MAP.start.rs) {
      routeSheet.appendAction(new Start(distance))
    }
    else if (action === RS_MAP.freeTime.rs || action === RS_MAP.break.rs) {
      const minutes = parseFloat(columns[2]);
      routeSheet.appendAction(new FreeTime(distance, minutes))
    }
    else if (action === RS_MAP.gasStop.rs) {
      routeSheet.appendAction(new GasStop(distance))
    }
    else if (action === RS_MAP.note.rs) {
      const note = columns.slice(2).join(' ');
      routeSheet.appendAction(new Note(distance, note || ""))
    }
    else if (action === RS_MAP.end.rs) {
      routeSheet.appendAction(new End(distance))
    }
  }

  return enduro
}

/**
 * Converts Full Route Sheet into a JSON object that's compatible with
 * fromJSON.  This is used to test that our route sheet generation actually
 * works.  See serializer tests.
 */
export function jsonFromFullRS(rsFile:string) {
  enum ParseState {
    STATE_TITLE = 1,
    STATE_ROUTE_SHEET
  }
  let state:ParseState = ParseState.STATE_TITLE;
  const enduro:any = {
    title: "",
    version: "2",
    routeSheet: {
      actions: [],
      resetsInTenths: 0,
      freeTimeSeconds: 0
    }
  }
  const routeSheet = enduro.routeSheet

  const lines = rsFile.split('\n');

  lines.forEach(function(line) {
    line = line.trim();
    const columns = line.match(/\S+/g) || [];

    if (ParseState.STATE_TITLE === state) {
        if (line.length) {
          let title = enduro.title.length ? (enduro.title + "\n") : "";
          title += line;
          enduro.title = title;
        }
        else {
          state = ParseState.STATE_ROUTE_SHEET;
        }
    }
    else if (ParseState.STATE_ROUTE_SHEET === state) {
      if (columns.length === 0) { return; }

      const time = columns[0]!.split(':');
      if (time.length !== 3) {
        return;
      }
      const secondsSinceMidnight = ((parseInt(time[0], 10) * 60) + parseInt(time[1], 10)) * 60 + parseInt(time[2], 10);
      if (routeSheet.actions.length === 0) {
        routeSheet.keyTime = secondsSinceMidnight;
      }

      const action:any = { type: {}};
      const actionMap = {};
      Object.keys(RS_MAP).forEach(function(key) {
        actionMap[RS_MAP[key].txt] = key;
      });
      actionMap['Break'] = 'freeTime';

      const hasMilesColumns = {
        [ActionType.SpeedChange]:true,
        [ActionType.Reset]:true,
        [ActionType.FreeZone]:true
      };
      const hasEndTimeColumns = {
        [ActionType.SpeedChange]:true,
        [ActionType.Reset]:true,
        [ActionType.FreeZone]:true,
        [ActionType.FreeTime]:true,
        ['Break']:true
      };
      const actionName:string = columns[2];
      if (!actionName) {
        throw new Error(`Line contains no action name\n${line}`)
      }

      const actionType = Object.keys(actionMap).find(function(key) {
          if (key.indexOf(actionName) === 0 && line.indexOf(key) !== -1) {
            action.type = actionMap[key]
            return true;
          }
          return false
      });
      if (!actionType) {
        throw new Error(`Unknown Action: ${actionName}`)
      }

      action.distance = parseFloat(columns[1]);

      if (ActionType.SpeedChange === action.type) {
        action.speed = parseFloat(columns[3]);
      }
      else if (ActionType.FreeZone === action.type) {
        action.toDistance = parseFloat(columns[4]);
        routeSheet.resetsInTenths += 10 * (action.toDistance - action.distance);
      }
      else if (ActionType.Reset === action.type) {
        action.toDistance = parseFloat(columns[4]);
        routeSheet.resetsInTenths += 10 * (action.toDistance - action.distance);
      }
      else if (ActionType.ResetToZero === action.type) {
      }
      else if (ActionType.FreeTime === action.type) {
        action.minutes = parseFloat(columns[3]) || parseFloat(columns[4]);
        routeSheet.freeTimeSeconds += action.minutes * 60;
      }
      else if (ActionType.Note === action.type) {
        action.note = columns.slice(3).join(' ');
      }

      let endTime;
      if (hasEndTimeColumns[actionMap[actionType]]) {
        endTime = columns[columns.length - 1];
      }
      else {
        endTime = columns[0];
      }
      endTime = endTime.split(':');
      const endTimeSecondsSinceMidnight = ((parseInt(endTime[0], 10) * 60) + parseInt(endTime[1], 10)) * 60 + parseInt(endTime[2], 10);
      action.startTimeInSeconds = secondsSinceMidnight - routeSheet.keyTime;
      action.endTimeInSeconds = endTimeSecondsSinceMidnight - routeSheet.keyTime;

      if (hasMilesColumns[actionMap[actionType]]) {
        action.endDistance = Util.round10(parseFloat(columns[columns.length - 2]) * 10, -1);
        action.distanceToGo = Util.round10(parseFloat(columns[columns.length - 3]) * 10, -1);
      }
      else {
        action.endDistance = Util.round10(action.distance * 10, -1);
      }

      routeSheet.actions.push(action);
    }
  });

  return enduro;
}
