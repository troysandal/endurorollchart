import { getFirebase, getEnduro, getEnduroID } from '../firebase'
import RouteSheet from '../timekeeping/routesheet'
import {fromJSON} from '../timekeeping/serializeJSON'
import { toRS } from '../timekeeping/serializeRS'
import {RouteSheetViewer} from './routesheetView'
import Util from '../timekeeping/util'
import Enduro from '../timekeeping/enduro'
import { doc, getDoc } from 'firebase/firestore'

let enduro:Enduro

$('#edit').on('click', function() {
  window.location.pathname = "enduroEdit.html";
});


$('#download').on('click', function() {
  const rsEnduro = toRS(enduro)
  let title
  if (enduro.title.length) {
    title = enduro.title.replace(/\s+/g, ' ')
  } else {
    title = "Unknown Enduro"
  }
  const blob = new Blob([rsEnduro], {type: "text/plain;charset=utf-8"});
  saveAs(blob, `${title}.rs`)
});

function saveAs(blob: Blob, fileName: string) {
  const link = document.createElement("a");
  link.download = fileName
  link.href = URL.createObjectURL(blob);
  link.click();
}


$('#print').on('click', function() {
  window.location.pathname = "enduroPrint.html";
});

$('#JART').on('click', function() {
  window.location.pathname = 'jart.html'
});

async function init() {
  const id = getEnduroID()

  if (id !== null) {
    const routeJSON = await getEnduro(id)
    if (routeJSON === null) {
      alert('Enduro not found.')
      return
    }
    enduro = fromJSON(routeJSON)
    const routeSheet:RouteSheet = enduro.routeSheet;
    const snapshot = await getDoc(doc(getFirebase().firestore, "users", routeJSON['userId']))
    const userData = snapshot.data() ?? { userName: 'Anonymous Rider' }

    $('#title').text(enduro.title);
    $('#author').text(userData.userName);
    $('#createdAt').text(routeJSON['createdAt'].toDate().toLocaleDateString());
    $('#keyTime').text(Util.secondsToTime(routeSheet.getKeyTime(), 0));
    $('#endTime').text(Util.secondsToTime(routeSheet.getKeyTime(), routeSheet.getDuration()));
    $('#freeTime').text(Util.secondsToTime(0, routeSheet.getFreeTime()));
    $('#distance').text(Util.strNaN(routeSheet.getLength()));
    $('#distanceOnGround').text(Util.strNaN(routeSheet.getGroundDistance()));
    $('#resetDistance').text(Util.strNaN(routeSheet.getResetDistance()));
    $('#totalLaps').text(Util.strNaN(routeSheet.getLaps().length, 0));
    
    new RouteSheetViewer(routeSheet, $('#container'));
    console.log('enduro.ts loaded')

    const { auth } = getFirebase()
    if (auth.currentUser?.uid === routeJSON['userId']) {
      $('#edit').show()
    }
    }
}

init()