import { Action, ActionType, Note } from "../timekeeping/actions";
import Enduro from "../timekeeping/enduro";
import JART from "../timekeeping/jart"
import RouteSheet from "../timekeeping/routesheet";
import Util from "../timekeeping/util";

/*************************** Utilities ***************************/

function formatMinute(minute) {
  return ("0" + minute).slice(-2);
}
function formatDistance(distance, decimals = 1) {
  return distance.toFixed(decimals);
}

/************************** View Models **************************/

class JARTViewModel {
  enduro:Enduro
  jart:JART

  constructor(enduro:Enduro, jart) {
    this.enduro = enduro
    this.jart = jart;
  }

  get routeSheet():RouteSheet { return this.enduro.routeSheet }
}

/***************************** Views *****************************/

class JARTColumnView {
  viewModel: JARTViewModel
  container: JQuery<HTMLElement>
  pageRow!: JQuery<HTMLElement>
  columns: number
  inPageHeight: number
  jartTBody!: JQuery<HTMLElement>
  timeInLeftColumn: boolean = true

  constructor(viewModel, columns, timeInLeftColumn) {
    this.viewModel = viewModel;
    this.container = $('<div></div>');
    this.columns = columns || 1;
    this.inPageHeight = this.screenHeight();
    this.timeInLeftColumn = timeInLeftColumn;
  }
  /**
   * This is a very hacky way of figuring out the screen height in pixels.
   * It's used in determining when to insert a page break in a JART table.
   * This works in conjunction with print_jart.css#multi_col_jart style which
   * sets the overall page size and margins. All this could be vastly improved
   * but so far so good for Chrome and Safari printing from iOS, Mac and Android.
   * 
   * This looks to be more of a margins issue, this article is maybe a better fix.
   * https://stackoverflow.com/questions/13154147/how-to-set-safari-print-margins-via-css-to-print-borderless
   * 
   * @returns Height of screen in screen pixels.
   */
  screenHeight() {
    // const is_ios = /iP(ad|od|hone)/i.test(window.navigator.userAgent);
    const is_safari = !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);

    let height = 10;
    let dpi = 96;

    if (is_safari) {
      height = 9.0;
      dpi = 92;
    }

    return height * dpi;
  };

  generate(parentContainer) {
    // Add ourselves to the document so that we can measure how tall
    // each table gets when a row is added.
    parentContainer.append(this.container);
    this.newColumn();
    const generator = new JARTRowGenerator(this.viewModel, this.timeInLeftColumn, this.append.bind(this));
    generator.generate();
  }

  numberColumnsOnCurrentPage() {
    return $('table.jart', this.pageRow).length;
  }

  newPage() {
    var pageTable = $(
      `<table class="${this.columns}_col_jart multi_col_jart"><tbody><tr></tr></tbody></table>`,
      );
    this.pageRow = $('tr', pageTable);
    this.container.append(pageTable);
  }

  newColumn() {
    var numColumns = this.numberColumnsOnCurrentPage();

    if (numColumns >= this.columns || numColumns === 0) {
      this.newPage();
    }

    var pageColumn = $('<td></td>');
    this.pageRow.append(pageColumn);

    var jartTable = $('<table class="jart"><tbody id="jartChart"></tbody></table>');
    this.jartTBody = $('tbody', jartTable);
    pageColumn.append(jartTable);
  }

  append(htmlRow) {
    var row = $(htmlRow);

    this.jartTBody.append(row);

    if (this.columns > 1) {
      const height = $(this.pageRow)!.height() ?? 0
      if (height > this.inPageHeight) {
        row.remove();
        this.newColumn();
        this.jartTBody.append(row);
      }
    }
  }
};

const STYLE_MAP =
{
  [ActionType.SpeedChange]: 'speed',
  [ActionType.Reset]:       'reset',
  [ActionType.ResetToZero]: 'resetTo0',
  [ActionType.FreeTime]:    'freeTime',
  [ActionType.FreeZone]:    'freeZone',
  [ActionType.GasStop]:     'gasStop',
  [ActionType.Known]:       'known',
  [ActionType.Note]:        'note',
  [ActionType.Start]:       'start',
  [ActionType.End]:         'end',
  'title':                  'title',
  'possible':               'possible'
}

class JARTRowGenerator {
  viewModel: JARTViewModel
  callback: (row:string) => void
  timeInLeftColumn: boolean = false

  constructor(viewModel, timeInLeftColumn, callback) {
    this.viewModel = viewModel;
    this.timeInLeftColumn = timeInLeftColumn;
    this.callback = callback
  }

  generate() {
    var jart = this.viewModel.jart;
    this.callback('<tr class="jart_leader"><td colspan="3"></td></tr>');
    var self = this;

    for (let action of jart.rows) {
      var actionType = STYLE_MAP[action.type];
      var writer = self['write_' + actionType] || self.write_default;
      writer.call(self, action);
    }
  }

  write_title(action:Action) {
    var actionType = STYLE_MAP[action.type];
    var titleLines = this.viewModel.enduro.title.split('\n');
    var self = this;
    var row;

    [0,1,2].forEach(function(rowIndex) {
      row = '';
      row += `<tr class="jart_${actionType}">`;
      row += `<td colspan="3">${titleLines[rowIndex] || "&nbsp;"}</td>`;
      row += '</tr>';
      self.callback(row);
    });

    const keyTime = Util.keyTimeNoSeconds(this.viewModel.routeSheet.getKeyTime(), true);
    row = '';
    row += `<tr class="jart_keyTime">`;
    row += `<td colspan="3">Key Time : ${keyTime}</td>`;
    row += '</tr>';
    self.callback(row);
  }

  write_default(action:Action) {
    var row = '';
    var actionType = STYLE_MAP[action.type];

    row += `<tr class="jart_${actionType}">`;
    row += `<td colspan="3">${actionType}</td>`;
    row += '</tr>';

    this.callback(row);
  }

  write_note(action:Note) {
    var row = '';
    var actionType = STYLE_MAP[action.type];

    row = '';
    row += `<tr class="jart_${actionType}">`;
    row += `<td colspan="3" class="note_body">${action.note || ""}</td>`;
    row += '</tr>';

    this.callback(row);
  }

  writeTimeDistance(minute, distance) {
    if (this.timeInLeftColumn) {
      return minute + distance;
    } else {
      return distance + minute;
    }
  }

  write_speedAndOrPossible(action) {
    var row = '';
    var actionType = STYLE_MAP[action.type];
    var possibleClass = action.isPossible ? "possible" : "";

    row += `<tr class="jart_${actionType} time_speed_distance" ${possibleClass}>`;
    row += this.writeTimeDistance(
      `<td>${formatMinute(action.minute)}</td>`,
      `<td>${formatDistance(action.startDistance / 10)}</td>`
    );
    row += `<td>${action.speed}</td>`;
    row += '</tr>';

    this.callback(row);
  }

  write_startOrKnown(action) {
    var row = '';
    var actionType = STYLE_MAP[action.type];
    var headerText = ActionType.Known === action.type ? "KNOWN" : "START";

    row = `<tr class="jart_${action.type}">`;
    row += `<td colspan="3" class="action_name">${headerText}</td>`;
    row += `</tr>`;
    this.callback(row);

    row = `<tr class="jart_${actionType} time_speed_distance">`;
    row += this.writeTimeDistance(
      `<td>${formatMinute(action.minute)}</td>`,
      `<td>${formatDistance(action.startDistance / 10)}</td>`
    )
    row += `<td>${action.speed}</td>`
    row += '</tr>';

    this.callback(row);
  }

  write_freeTime(action) {
    var row;
    var actionType = STYLE_MAP[action.type];

    row = `<tr class="jart_${actionType}">`;
    row += '<td colspan="3" class="action_name">FREE TIME</td>';
    row += '</tr>';
    this.callback(row);

    row = `<tr class="jart_${actionType}">`;
    row += '<td colspan="3">at ' + formatDistance(action.startDistance / 10, 2) + '</td>';
    row += '</tr>';
    this.callback(row);

    row = `<tr class="jart_${actionType}">`;
    row += '<td  colspan="3">' + (action.seconds / 60) + ' min</td>';
    row += '</tr>';
    this.callback(row);
  }

  write_gasStop(action) {
    var row;
    var actionType = STYLE_MAP[action.type];

    row = `<tr class="jart_${actionType}">`
    row += '<td colspan="3" class="action_name">GAS STOP</td>';
    row += '</tr>';
    this.callback(row);

    row = `<tr class="jart_${actionType}">`
    row += '<td colspan="3">at ' + formatDistance(action.startDistance / 10, 2) + '</td>';
    row += '</tr>';
    this.callback(row);

    row = `<tr class="jart_${actionType}">`;
    row += '<td  colspan="3">' + Util.secondsToTime(this.viewModel.routeSheet.getKeyTime(), action.startTimeInSeconds) + '</td>';
    row += '</tr>';
    this.callback(row);
  }

  write_reset(action) {
    var row;
    var actionType = STYLE_MAP[action.type];

    row = `<tr class="jart_${actionType}">`;
    row += '<td colspan="3" class="action_name">RESET</td>';
    row += '</tr>';
    this.callback(row);

    row = `<tr class="jart_${actionType}">`;
    row += '<td colspan="3">from ' + formatDistance(action.startDistance / 10, 2) + '</td>';
    row += '</tr>';
    this.callback(row);

    row = `<tr class="jart_${actionType}">`;
    row += '<td  colspan="3">to ' + formatDistance(action.resetTo / 10, 2) + '</td>';
    row += '</tr>';
    this.callback(row);
  }

  write_resetTo0(action) {
    var row;
    var actionType = STYLE_MAP[action.type];

    row = `<tr class="jart_${actionType}">`;
    row += '<td colspan="3" class="action_name">RESET TO 0</td>';
    row += '</tr>';
    this.callback(row);

    row = `<tr class="jart_${actionType}">`;
    row += '<td colspan="3">at ' + formatDistance(action.startDistance / 10, 2) + '</td>';
    row += '</tr>';
    this.callback(row);
  }

  write_freeZone(action) {
    var row;
    var actionType = STYLE_MAP[action.type];

    row = `<tr class="jart_${actionType}">`;
    row += '<td colspan="3" class="action_name">FREE ZONE</td>';
    row += '</tr>';
    this.callback(row);

    row = `<tr class="jart_${actionType}">`;
    row += '<td colspan="3">from ' + formatDistance(action.startDistance / 10, 2) + '</td>';
    row += '</tr>';
    this.callback(row);

    row = `<tr class="jart_${actionType}">`;
    row += '<td  colspan="3">to ' + formatDistance(action.freeTo / 10, 2) + '</td>';
    row += '</tr>';
    this.callback(row);
  }

  write_end(action) {
    var row;
    var actionType = STYLE_MAP[action.type];

    row = `<tr class="jart_${actionType}">`
    row += '<td colspan="3" class="action_name">END</td>';
    row += '</tr>';
    this.callback(row);

    row = `<tr class="jart_${actionType}">`
    row += '<td colspan="3">at ' + formatDistance(action.startDistance / 10, 2) + '</td>';
    row += '</tr>';
    this.callback(row);
  }
  write_possible(action) { this.write_speedAndOrPossible(action) }
  write_speed(action) { this.write_speedAndOrPossible(action) }
  write_known(action) { this.write_startOrKnown(action) }
  write_start(action) { this.write_startOrKnown(action) }
};



export class JARTViewer {
  constructor(enduro:Enduro, jart:JART, parent, columns:number, timeInLeftColumn:boolean = false) {
    var viewModel = new JARTViewModel(enduro, jart);
    var view = new JARTColumnView(viewModel, columns, timeInLeftColumn);
    view.generate(parent);
  }
}
