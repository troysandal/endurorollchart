import { getEnduro, getEnduroID } from '../firebase'
import RouteSheet from '../timekeeping/routesheet'
import {fromJSON} from '../timekeeping/serializeJSON'
import {RouteSheetViewer} from './routesheet.view'
import Enduro from '../timekeeping/enduro'


async function init() {
  const id = getEnduroID()

  if (id !== null) {
      const routeJSON = await getEnduro(id)
      const enduro:Enduro = fromJSON(routeJSON)
      const routeSheet:RouteSheet = enduro.routeSheet;
      
      var titles = enduro.title.split('\n');
      titles.forEach(function(title) {
      $('#titles').append(`<div class="title">${title}</div>`);
      })
      
      new RouteSheetViewer(routeSheet, $('#container'));
        }
}

init()