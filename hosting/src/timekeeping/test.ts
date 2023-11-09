import {fromRS} from "./serializeRS"
import { toJSON, serializersForJSON } from "./serializeJSON";
import { ActionType, End, FreeTime, FreeZone, GasStop, Known, Note, Reset, ResetTo0, SpeedChange, Start } from "./actions";


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

var f = FROM_RS_MAP.get(ActionType.SpeedChange)
console.log(f)
console.log(typeof f)
var g = new f()
console.log(typeof g)

const rsFile = `# Enduro Route Sheet
  title Pine Hill Enduro    May 2nd 2004  KEYTIME 9:00 a.m.
  keytime   9:00
  speed   0.00  20
  speed   3.00  15
  speed   4.00  20
  speed   6.00   6
  speed   6.30  15
  reset   7.96   9.90
  speed  23.80  30
  reset  26.49  27.29
  speed  27.30  18
  reset  27.58  31.57
  speed  49.50   6
  note  49.80 START CONTROL
  speed  49.80  12
  note  50.12 GAS AVAILABLE
  reset  50.12  55.21
  note  56.00 START CONTROL
  speed  56.00  24
  reset  56.60  58.60
  reset  70.00  72.00
  speed  72.40  15
  speed  73.90  18
  speed  77.80  24
  speed  79.80  30
  speed  81.30  18
  reset  81.39  85.87
    end  99.30
`
const enduro = fromRS(rsFile)

const v2JSON:any = toJSON(enduro)
console.log(JSON.stringify(v2JSON))


// ----------------------

// const json = {}
const v1json = JSON.parse('{"title":"Pine Hill Enduro May 2nd 2004 KEYTIME 9:00 a.m.","keyTime":32400,"actions":[{"type":{"speed":true},"distance":0,"speed":20},{"type":{"speed":true},"distance":3,"speed":15},{"type":{"speed":true},"distance":4,"speed":20},{"type":{"speed":true},"distance":6,"speed":6},{"type":{"speed":true},"distance":6.3,"speed":15},{"type":{"reset":true},"distance":7.96,"toDistance":9.9},{"type":{"speed":true},"distance":23.8,"speed":30},{"type":{"reset":true},"distance":26.49,"toDistance":27.29},{"type":{"speed":true},"distance":27.3,"speed":18},{"type":{"reset":true},"distance":27.58,"toDistance":31.57},{"type":{"speed":true},"distance":49.5,"speed":6},{"type":{"note":true},"distance":49.8,"note":"START CONTROL"},{"type":{"speed":true},"distance":49.8,"speed":12},{"type":{"note":true},"distance":50.12,"note":"GAS AVAILABLE"},{"type":{"reset":true},"distance":50.12,"toDistance":55.21},{"type":{"note":true},"distance":56,"note":"START CONTROL"},{"type":{"speed":true},"distance":56,"speed":24},{"type":{"reset":true},"distance":56.6,"toDistance":58.6},{"type":{"reset":true},"distance":70,"toDistance":72},{"type":{"speed":true},"distance":72.4,"speed":15},{"type":{"speed":true},"distance":73.9,"speed":18},{"type":{"speed":true},"distance":77.8,"speed":24},{"type":{"speed":true},"distance":79.8,"speed":30},{"type":{"speed":true},"distance":81.3,"speed":18},{"type":{"reset":true},"distance":81.39,"toDistance":85.87},{"type":{"end":true},"distance":99.3}]}')
const v2json = JSON.parse('{"version": "2", "title":"Pine Hill Enduro May 2nd 2004 KEYTIME 9:00 a.m.","routeSheet":{"keyTime":32400,"actions":[{"type":"speedChange","distance":0,"speed":20},{"type":"speedChange","distance":3,"speed":15},{"type":"speedChange","distance":4,"speed":20},{"type":"speedChange","distance":6,"speed":6},{"type":"speedChange","distance":6.3,"speed":15},{"type":"reset","distance":7.96,"toDistance":9.9},{"type":"speedChange","distance":23.8,"speed":30},{"type":"reset","distance":26.49,"toDistance":27.29},{"type":"speedChange","distance":27.3,"speed":18},{"type":"reset","distance":27.58,"toDistance":31.57},{"type":"speedChange","distance":49.5,"speed":6},{"type":"note","distance":49.8,"note":"START CONTROL"},{"type":"speedChange","distance":49.8,"speed":12},{"type":"note","distance":50.12,"note":"GAS AVAILABLE"},{"type":"reset","distance":50.12,"toDistance":55.21},{"type":"note","distance":56,"note":"START CONTROL"},{"type":"speedChange","distance":56,"speed":24},{"type":"reset","distance":56.6,"toDistance":58.6},{"type":"reset","distance":70,"toDistance":72},{"type":"speedChange","distance":72.4,"speed":15},{"type":"speedChange","distance":73.9,"speed":18},{"type":"speedChange","distance":77.8,"speed":24},{"type":"speedChange","distance":79.8,"speed":30},{"type":"speedChange","distance":81.3,"speed":18},{"type":"reset","distance":81.39,"toDistance":85.87},{"type":"end","distance":99.3}]}}')
const version = v2JSON?.version ?? "1"
console.assert(version === "2", `v2JSON?.version = ${v2JSON?.version} !== 2`)
const v1Serializers = serializersForJSON(v1json)
const v2Serializers = serializersForJSON(v2json)
console.assert(v1Serializers.version.number === "1", `v1Serializers.version.number = ${v1Serializers.version.number} !== 1`)
console.assert(v2Serializers.version.number === "2", `v2Serializers.version.number = ${v2Serializers.version.number} !== 2`)
