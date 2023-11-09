import Util from '../timekeeping/util'
import {RS_MAP} from '../timekeeping/serializeRS'
import { Action, ActionType, SpeedChange, Note, FreeTime, Reset, FreeZone } from '../timekeeping/actions'
import RouteSheet from '../timekeeping/routesheet'

class RouteSheetViewModel {
    routeSheet:RouteSheet

    constructor(routeSheet) {
        this.routeSheet = routeSheet;
    }
}

class RouteSheetView {
    viewModel: RouteSheetViewModel
    container: JQuery<HTMLElement>

    constructor(viewModel:RouteSheetViewModel) {
        this.viewModel = viewModel;
        this.container = $('<table class="routeSheet" />');
        this.generate();
    }

    generateHeader() {
        var template = '<thead> \
            <td>Start<br />Time</td> \
                <td>Start<br />Mile</td>\
                <td colspan="2">Action</td>\
                <td>Miles<br />To Go</td>\
                <td>End<br />Mile</td>\
                <td>End<br />Time</td>\
        </thead>';
        this.container.append(template);
    }

    generate() {
        this.container.empty();
        this.generateHeader();
        var self = this;
        this.container.append('<tbody />');

        this.viewModel.routeSheet.actions().forEach(function(action, index) {
            self.appendAction(action, index);
        });
    }

    appendAction(action:Action, _index) {
        var row;

        if (action.error) {
            row = `<tr class="error" title="${action.error}">`;
        }
        else {
            row = '<tr>';
        }
        row += '<td>' + Util.secondsToTime(
            this.viewModel.routeSheet.getKeyTime(),
            action.startTimeInSeconds) + '</td>';
        row += '<td>' + Util.strNaN(action.distance) + '</td>';

        // action + param, if any
        var param:string | null = null;
        var paramSpan;
        var milesToGo = Util.strNaN(action.distanceToGoInTenths / 10);
        var endMile = Util.strNaN(action.endDistanceInTenths / 10);

        if (action instanceof SpeedChange) {
            param = '' + (action as SpeedChange).speed + " mph";
        }
        else if (action instanceof FreeTime) {
            param = '' + (action as FreeTime).freeTime + " min";
            milesToGo = '';
            endMile = '';
        }
        else if (action instanceof Note) {
            param = '' + (action as Note).note;
            paramSpan = 4;
        }
        else if (   ActionType.ResetToZero === action.type
                    || ActionType.Start === action.type
                    || ActionType.End === action.type
                    || ActionType.GasStop === action.type
                    || ActionType.Known === action.type) {
            param = '';
            paramSpan = 4;
        }
        else if (action instanceof Reset) {
            param = '' + Util.strNaN(action.toDistanceInTenths / 10);
        }
        else if (action instanceof FreeZone) {
            param = '' + Util.strNaN(action.toDistanceInTenths / 10);
        }

        const actionType = action.type;
        let actionName = RS_MAP[actionType].txt;

        if (action.error) {
            actionName = `${actionName}<img src="/images/error.png" width="16" height="16" title="${action.error}"/>`
        }

        if (param != null) {
            paramSpan = paramSpan || 1;
            row += `<td class="actionType">${actionName}</td>`
            row += `<td class="${actionType}" colspan="${paramSpan}">${param}</td>`
        }
        else {
            row += `<td class="actionType" colspan="2">${actionName}</td>`
        }

        if (paramSpan !== 4) {
            row += '<td>' + milesToGo + '</td>';
            row += '<td>' + endMile + '</td>';
            row += '<td>' + Util.secondsToTime(
            this.viewModel.routeSheet.getKeyTime(),
            action.endTimeInSeconds) + '</td>';
        }
        row += '</tr>';
        this.container.append(row);
    }
};

export class RouteSheetViewer {
    routeSheet: RouteSheet

    constructor(routeSheet:RouteSheet, parent) {
        this.routeSheet = routeSheet;
        const viewModel = new RouteSheetViewModel(routeSheet);
        const view = new RouteSheetView(viewModel);
        parent.append(view.container);
    }
}