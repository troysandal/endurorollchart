import { Action, ActionType, createActionFromType, FreeTime, FreeZone, Note, Reset, SpeedChange } from '../timekeeping/actions';
import Enduro from '../timekeeping/enduro';
import RouteSheet from '../timekeeping/routesheet'
import { RS_MAP } from '../timekeeping/serializeRS';
import {default as Util, EventDispatcher} from '../timekeeping/util'
import { DistanceBehavior, KeyTimeBehavior, MinutesBehavior, SpeedBehavior, StringBehavior } from './behaviors';

// -------------------------- Views Models ---------------------------

class RouteSheetViewModel extends EventDispatcher {
  enduro:Enduro
  get routeSheet():RouteSheet { return this.enduro.routeSheet }

  constructor (enduro:Enduro) {
    super()
    this.enduro = enduro;
    var self = this;
    this.routeSheet.on('reindex', function() {
      self.dispatch({name: 'reindex'});
    });
    this.routeSheet.on('insert', function(e) {
      self.dispatch(e);
    });
    this.routeSheet.on('delete', function(e) {
      self.dispatch(e);
    });
  }
}


class RouteSheetActionViewModel extends EventDispatcher {
  parent:RouteSheetViewModel
  action:Action
  routeSheet:RouteSheet
  isFirstSpeed:boolean
  isAddNewRow:boolean

  constructor(routeSheetViewModel, index) {
    super()
    this.parent = routeSheetViewModel;
    this.routeSheet = routeSheetViewModel.routeSheet;
    this.action = this.routeSheet.get(index);
    this.isFirstSpeed = index === 0;
    this.isAddNewRow = index < 0;
    this.routeSheet.on('recalc', this.onRecalc.bind(this));
  }


  onRecalc(_event) {
    this.dispatch({name: 'update'});
  }


  mutate(toType) {
    var index = this.routeSheet.getIndex(this.action);
    var newAction = createActionFromType(toType, this.action.distance);
    this.routeSheet.deleteAction(this.action);
    this.routeSheet.insertAction(newAction, index, true);
  }


  changeLap(newLap: number) {
    this.routeSheet.changeLap(this.action, newLap);
  }

  setStartDistance(startDistance: number) {
    this.action.distance = startDistance;
    this.routeSheet.recalc();
  }

  setSpeed(speed: number) {
    console.assert(this.action instanceof SpeedChange);
    if (this.action instanceof SpeedChange) {
      this.action.speed = speed;
      this.routeSheet.recalc();
    }
  }

  setReset(toDistance: number) {
    console.assert(this.action instanceof Reset);
    if (this.action instanceof Reset) {
      this.action.to = toDistance;
      this.routeSheet.recalc();
    }
  }

  setFreeTo(toDistance: number) {
    console.assert(this.action instanceof FreeZone);
    if (this.action instanceof FreeZone) {
      this.action.to = toDistance;
      this.routeSheet.recalc();
    }
  }

  setFreeTime(minutes: number) {
    console.assert(this.action instanceof FreeTime);
    if (this.action instanceof FreeTime) {
      this.action.freeTime = minutes;
      this.routeSheet.recalc();
    }
  }

  setNote(notes: string) {
    console.assert(this.action instanceof Note);
    if (this.action instanceof Note) {
      this.action.note = notes;
      this.routeSheet.recalc();
    }
  }
}

// ------------------------------ Views ------------------------------


class RouteSheetActionView {
  viewModel: RouteSheetActionViewModel
  container!: JQuery<HTMLElement>
  row: JQuery<HTMLElement>
  typePicker
  startTimeEditor
  startDistanceEditor
  actionCell
  errorImage
  distanceToGo!: JQuery<HTMLElement>
  endDistance!: JQuery<HTMLElement>
  endTimeInSeconds!: JQuery<HTMLElement>
  lapEditor!: JQuery<HTMLElement>
  startTime!: JQuery<HTMLElement>
  lap!: JQuery<HTMLElement>
  startDistance!: JQuery<HTMLElement>
  paramEditor!: JQuery<HTMLElement>

  constructor(viewModel: RouteSheetActionViewModel) {
    this.viewModel = viewModel;
    this.row = $('<tr />');
    this.generate();
    this.update();
    var self = this;

    viewModel.on('update', function(_event) {
      self.update();
    });
  }

  focus(mutate) {
    if (mutate) {
      var element = this.typePicker;
      element.focus();
      console.log("RouteSheetActionView::focus() - mutating");
    }
    else {
      var element = this.startTimeEditor || this.startDistanceEditor;
      window.setTimeout(function() {
        // element.focus();
        element.select();
      }, 1);
      console.log("RouteSheetActionView::focus() - time/distance");
    }
  }

  generate() {
    var action = this.viewModel.action;
    this.row.empty();

    this.generateLap();
    this.generateStartTime();
    this.generateStartDistance(action);

    this.actionCell = $('<td />');
    this.row.append(this.actionCell);

    this.errorImage = $(`<img src="/images/error.png" style="display:none" width="16" height="16" title="${action.error ?? ''}"/>`);
    this.actionCell.append(this.errorImage);

    type Generator = (action:Action) => void
    const GENERATOR_MAP = new Map<string, Generator>([
      [ActionType.SpeedChange, this.generate_speed as Generator],
      [ActionType.Reset, this.generate_reset],
      [ActionType.ResetToZero, this.generate_resetTo0],
      [ActionType.FreeTime, this.generate_freeTime],
      [ActionType.FreeZone, this.generate_freeZone],
      [ActionType.GasStop, this.generate_gasStop],
      [ActionType.Known, this.generate_known],
      [ActionType.Note, this.generate_note],
      [ActionType.Start, this.generate_start],
      [ActionType.End, this.generate_end]
    ])
    const generator:Generator = GENERATOR_MAP.get(action.type) as Generator
    console.assert(generator, `No generator found for ${action.type}`)
    generator.call(this, action);
    this.distanceToGo = $('<td />');
    this.row.append(this.distanceToGo);
    this.endDistance = $('<td />');
    this.row.append(this.endDistance);
    this.endTimeInSeconds = $('<td />');
    this.row.append(this.endTimeInSeconds);

    var actionCell = $('<td></td>');

    var insertButton = $('<button>Insert</button>');
    actionCell.append(insertButton);
    var self = this;
    insertButton.on('click', function() {
      var index = $('tr', self.row.parent()).index(self.row);
      var newAction = new SpeedChange(action.distance, 18);
      self.viewModel.routeSheet.insertAction(newAction, index + 1);
    });

    if (!this.viewModel.isFirstSpeed) {
      var deleteButton = $('<button>Delete</button>');
      actionCell.append(deleteButton);
      var self = this;
      deleteButton.on('click', function() {
        self.viewModel.routeSheet.deleteAction(action);
      });
    }

    this.row.append(actionCell);

    this.container = this.row
  }

  update() {
    var action = this.viewModel.action;

    this.updateError();
    this.updateLap();
    this.updateStartTime();
    this.updateStartDistance();

    type Updator = (action:Action) => void
    const UPDATOR_MAP = new Map<string, Updator>([
      [ActionType.SpeedChange, this.update_speed],
      [ActionType.Reset, this.update_reset],
      [ActionType.FreeTime, this.update_freeTime],
      [ActionType.FreeZone, this.update_freeZone],
      [ActionType.Note, this.update_note]
    ])
    function defaultUpdator(action:Action) {
      console.log(`INFO - No updator found for action type ${action.type}`);
    }
    const updator:Updator = UPDATOR_MAP.get(action.type) || defaultUpdator;
    updator.call(this, action);

    this.distanceToGo.text(Util.textNaN(action.distanceToGoInTenths / 10));
    this.endDistance.text(Util.textNaN(action.endDistanceInTenths / 10));
    this.endTimeInSeconds.text(Util.secondsToTime(this.viewModel.routeSheet.getKeyTime(), action.endTimeInSeconds));
  }

  updateError() {
    var action = this.viewModel.action;
    if (action.error) {
      this.row.addClass('error');
      this.row.attr('title', action.error);
      this.errorImage.show();
      this.errorImage.attr('title', action.error);
    }
    else {
      this.row.removeClass('error');
      this.row.attr('title', null);
      this.errorImage.hide();
    }
  }

  generateTypePicker(action:Action) {
    const options = Object.keys(RS_MAP)
      .filter((v) => v !== 'break')
      .map((v) => ({type:v, txt:RS_MAP[v].txt, v1Type:RS_MAP[v].v1}))
      .map((v) => `<option value="${v.v1Type}"${v.type === action.type ? ' selected' : ''}>${v.txt}</option>`)
      .join('');

    const select = $(`<select>${options}</select>`);

    select.on('change', (e) => {
      const tov1Type = $(e.target).val();
      const toType = Object.keys(RS_MAP).filter((v) => RS_MAP[v].v1 === tov1Type)[0];
      this.viewModel.mutate(toType);
    });
    return select;
  }

  generateLap() {
    var cell = $('<td />');
    this.row.append(cell);
    var lap = this.viewModel.action.lap + 1;

    if (!this.viewModel.isFirstSpeed) {
      var input = `<input class="editable lap" type="text" value="${lap}">`;
      this.lapEditor = $(input);
      cell.append(this.lapEditor);

      var self = this;
      new MinutesBehavior(this.lapEditor, function(_oldValue, newValue) {
        self.viewModel.changeLap(newValue);
      });
    }
    else {
      this.lap = $(`<span>${lap}</span>`);
      cell.append(this.lap);
    }
  }

  updateLap() {
    var lap = this.viewModel.action.lap + 1;

    if (this.lapEditor) {
      this.lapEditor.val(lap);
    }
    else {
      this.lap.text(lap);
    }
  }

  generateStartTime() {
    var cell = $('<td />');
    this.row.append(cell);

    if (this.viewModel.isFirstSpeed) {
      this.startTimeEditor = $('<input class="editable time" type="text">');
      cell.append(this.startTimeEditor);
      var self = this;
      new KeyTimeBehavior(this.startTimeEditor, function(_oldValue, newValue) {
        self.viewModel.routeSheet.setKeyTime(newValue);
      });
    }
    else {
      this.startTime = $('<span></span>');
      cell.append(this.startTime);
    }
  }

  updateStartTime() {
    var startTime = Util.secondsToTime(
      this.viewModel.routeSheet.getKeyTime(),
      this.viewModel.action.startTimeInSeconds);

    if (this.startTimeEditor) {
      this.startTimeEditor.val(startTime);
    }
    else {
      this.startTime.text(startTime);
    }
  }

  generateStartDistance(action:Action) {
    var cell = $('<td />');
    this.row.append(cell);

    var distance = Util.strNaN(action.distance);

    if (!this.viewModel.isFirstSpeed) {
      this.startDistanceEditor = $(`<input class="editable distance" type="text" value="${distance}">`);
      cell.append(this.startDistanceEditor);
      var self = this;
      new DistanceBehavior(this.startDistanceEditor, function(_oldValue, newValue) {
        self.viewModel.setStartDistance(newValue);
      });
    }
    else {
      this.startDistance = $(`<span>${distance}</span>`);
      cell.append(this.startDistance);
    }
  }

  updateStartDistance() {
    var distance = Util.textNaN(this.viewModel.action.distance);
    if (this.startDistanceEditor) {
      this.startDistanceEditor.val(distance);
    }
    else {
      this.startDistance.text(distance);
    }
  }

  generate_speed(action: SpeedChange) {
    if (!this.viewModel.isFirstSpeed) {
      this.typePicker = this.generateTypePicker(action);
      this.actionCell.append(this.typePicker);
      this.actionCell.append(this.typePicker);
    }
    else {
      this.actionCell.append("<span>Speed: </span>");
    }

    var input = `<input class="editable speed" type="text" value="${action.speed}">`;
    this.paramEditor = $(input);

    var self = this;
    new SpeedBehavior(this.paramEditor, function(_oldValue, newValue) {
      self.viewModel.setSpeed(newValue);
    });

    this.actionCell.append(this.paramEditor);
  }

  update_speed() {
    if (this.viewModel.action instanceof SpeedChange) {
      this.paramEditor.val(this.viewModel.action.speed);
    }
  }

  generate_reset(action) {
    this.typePicker = this.generateTypePicker(action);
    this.actionCell.append(this.typePicker);

    var input = `<input class="editable distance" type="text" value="${Util.strNaN(action.toDistanceInTenths / 10)}">`;
    this.paramEditor = $(input);

    var self = this;
    new DistanceBehavior(this.paramEditor, function(_oldValue, newValue) {
      self.viewModel.setReset(newValue);
    });

    this.actionCell.append(this.paramEditor);
  }

  update_reset() {
    if (this.viewModel.action instanceof Reset) {
      this.paramEditor.val(Util.textNaN(this.viewModel.action.to));
    }
  }

  generate_freeTime(action: FreeTime) {
    this.typePicker = this.generateTypePicker(action);
    this.actionCell.append(this.typePicker);

    var input = `<input class="editable minutes" type="text" value="${action.freeTime}">`;
    this.paramEditor = $(input);

    var self = this;
    new MinutesBehavior(this.paramEditor, function(_oldValue, newValue) {
      self.viewModel.setFreeTime(newValue);
    });

    this.actionCell.append(this.paramEditor);
  }

  update_freeTime() {
    if (this.viewModel.action instanceof FreeTime) {
      this.paramEditor.val(this.viewModel.action.freeTime);
    }
  }

  generate_note(action: Note) {
    this.typePicker = this.generateTypePicker(action);
    this.actionCell.append(this.typePicker);

    this.actionCell.append('<br />');

    var input = `<input class="editable note" type="text" value="${action.note}">`;
    this.paramEditor = $(input);

    var self = this;
    new StringBehavior(this.paramEditor, function(_oldValue, newValue) {
      self.viewModel.setNote(newValue);
    });

    this.actionCell.append(this.paramEditor);
  }

  update_note() {
    if (this.viewModel.action instanceof Note) {
      this.paramEditor.val(this.viewModel.action.note ?? '');
    }
  }

  generate_resetTo0(action) {
    this.typePicker = this.generateTypePicker(action);
    this.actionCell.append(this.typePicker);
  }

  generate_gasStop(action) {
    this.typePicker = this.generateTypePicker(action);
    this.actionCell.append(this.typePicker);
  }

  generate_known(action) {
    this.typePicker = this.generateTypePicker(action);
    this.actionCell.append(this.typePicker);
  }

  generate_freeZone(action) {
    this.typePicker = this.generateTypePicker(action);
    this.actionCell.append(this.typePicker);

    var input = `<input class="editable distance" type="text" value="${Util.strNaN(action.toDistanceInTenths / 10)}">`;
    this.paramEditor = $(input);

    var self = this;
    new DistanceBehavior(this.paramEditor, function(_oldValue, newValue) {
      self.viewModel.setFreeTo(newValue);
    });

    this.actionCell.append(this.paramEditor);
  }

  update_freeZone() {
    if (this.viewModel.action instanceof FreeZone) {
      this.paramEditor.val(Util.textNaN(this.viewModel.action.to));
    }
  }


  generate_start(action) {
    this.typePicker = this.generateTypePicker(action);
    this.actionCell.append(this.typePicker);
  }

  generate_end(action) {
    this.typePicker = this.generateTypePicker(action);
    this.actionCell.append(this.typePicker);
  }
}


class RouteSheetEditorView {
  viewModel: RouteSheetViewModel
  container: JQuery<HTMLElement>
  actionViews

  constructor(viewModel) {
    this.viewModel = viewModel;
    this.container = $('<table border="all" style="font-family:courier new" />');

    this.actionViews = {};
    this.generate();

    this.viewModel.on('reindex', this.onReIndex.bind(this));
    this.viewModel.on('insert', this.onInsert.bind(this));
    this.viewModel.on('delete', this.onDelete.bind(this));
  }

  focus() {
    this.actionViews[0].focus();
  }

  onReIndex(_e) {
    this.generate();
  }

  onInsert(e) {
    this.insertAction(e.index, e.mutation);
  }

  onDelete(e) {
    var row = $('tbody tr', this.container).get(e.index);
    row?.remove();
  }

  insertAction(index:number, mutation:boolean = false) {
    var tbody = $('tbody', this.container);
    var actionViewModel = new RouteSheetActionViewModel(this.viewModel, index);
    var actionView = new RouteSheetActionView(actionViewModel);
    this.actionViews[index] = actionView;

    if (tbody.children().length === 0 || tbody.children().length === index) {
      tbody.append(actionView.container);
    }
    else {
      actionView.container.insertAfter(tbody.children()[index - 1]);
    }
    actionView.focus(mutation);
  }

  generateHeader() {
    const template = '<thead> \
      <td>Lap</td> \
      <td>Start<br />Time</td> \
      <td>Start<br />Mile</td> \
      <td>Action</td> \
      <td>Miles<br />To Go</td> \
      <td>End<br />Mile</td> \
      <td>End<br />Time</td> \
      <td>Actions</td> \
    </thead>'
    this.container.append(template);
  }

  generate() {
    this.container.empty();
    this.generateHeader();
    var self = this;
    this.container.append('<tbody />');

    this.viewModel.routeSheet.actions().forEach(function(_action, index) {
      self.insertAction(index);
    });
  }
}


export class RouteSheetEditor {
  constructor(enduro:Enduro, parent) {
    const viewModel = new RouteSheetViewModel(enduro);
    const view = new RouteSheetEditorView(viewModel);
    parent.append(view.container);
    view.focus();
  }
}