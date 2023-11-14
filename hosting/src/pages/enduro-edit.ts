import RouteSheet from '../timekeeping/routesheet'
import Enduro from '../timekeeping/enduro'
import { fromJSON, toJSON } from '../timekeeping/serializeJSON'
import Util from '../timekeeping/util'
import { RouteSheetEditor } from './routesheet.editor'
import { SpeedBehavior } from './behaviors'
import { onAuth, getEnduro, getEnduroID, getFirebase } from '../firebase'
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'

let routeId: string | null
let isPublished: boolean = false
let enduro:Enduro
let routeSheet:RouteSheet // TODO - you dont' need this alias here right?

onAuth(async (user) => {
  if (!user) {
    console.warn('must be logged in to save enduro')
    alert('You will not be able to save this enduro as you are not logged in.')
    document.getElementById('save')?.remove()
  }
  routeId = getEnduroID()

  if (routeId !== null) {
    const route = await getEnduro(routeId)
    if (!route) {
      // TODO - Show Error Message 
      console.warn(`Enduro ${routeId} not found`)
      return
    }
    enduro = fromJSON(route)
    isPublished = route['isPublished'] ?? false
  } else {
    enduro = new Enduro()
    enduro.title = "New Enduro"
    isPublished = false
  }

  routeSheet = enduro.routeSheet;
  setupUI()
})

function setupUI() {
  $('#title').on('input', function(e) {
    enduro.title = "" + $(e.target).val();
  })

  function updateHeader() {
    $('#title').val(enduro.title);
    $('#title').trigger('change');
    $('#keyTime').text(Util.secondsToTime(routeSheet.getKeyTime(), 0));
    $('#endTime').text(Util.secondsToTime(routeSheet.getKeyTime(), routeSheet.getDuration()));
    $('#freeTime').text(Util.secondsToTime(0, routeSheet.getFreeTime()));
    $('#distance').text(Util.strNaN(routeSheet.getLength()));
    $('#distanceOnGround').text(Util.strNaN(routeSheet.getGroundDistance()));
    $('#resetDistance').text(Util.strNaN(routeSheet.getResetDistance()));
    $('#totalLaps').text(Util.strNaN(routeSheet.getLaps().length, 0));
  }
  routeSheet.on('recalc', updateHeader);
  updateHeader();

  new RouteSheetEditor(enduro, $('#container'));

  $('#save').on('click', saveEnduro)
  $('#publish').on('click', togglePublishState)
  updatePublishButton()

  // Setup Route Options
  const minSecretSpeedBehavior = new SpeedBehavior($('#secretMinSpeed'), function(_oldValue, newValue) {
    routeSheet.options.secretMinSpeed = Math.round(newValue);
    $('#secretMinSpeed').val(routeSheet.options.secretMinSpeed);
  });
  minSecretSpeedBehavior._min = 1;

  $('#useSecretMinSpeed').on('click', (e) =>{
    console.log((e.target as HTMLInputElement).checked)
    routeSheet.options.useSecretMinSpeed = (e.target as HTMLInputElement).checked;
    if (routeSheet.options.useSecretMinSpeed) {
      $('#minSecretSpeedBlock').show();
    } else {
      $('#minSecretSpeedBlock').hide();
    }  
  })

  $('#useSecretMinSpeed').prop('checked', routeSheet?.options?.useSecretMinSpeed ?? false);
  $('#secretMinSpeed').val(routeSheet?.options?.secretMinSpeed ?? '')
  if (routeSheet?.options?.useSecretMinSpeed) {
    $('#minSecretSpeedBlock').show();
  }

  function makeTextAreaMultiLine(element) {
    function setRows() {
      function isNewLine(accum, character) {
        return accum + (character === '\n' ? 1 : 0);
      }
  
      const text = $(element).val()
      const newLineCount = Array.prototype.reduce.call(text, isNewLine, 0) as number;
      $(element)[0].rows = newLineCount + 1;
    }
    setRows();
    $(element).on('input change propertychange', setRows);
  }
  
  makeTextAreaMultiLine('#title');
}

async function saveEnduro() {
  const json = toJSON(enduro);
  const db = getFirebase().firestore;

  if (routeId) {
    try {
      await updateDoc(doc(db, "enduros", routeId), {
        userId: getFirebase().auth.currentUser?.uid,
        updatedAt: serverTimestamp(),
        isPublished,
        ...json
      });
      console.log(`Successfully Updated Enduro ${routeId}`)
    } catch (e) {
      console.error(`Failed to updated enduro '${routeId}' - ${e}`)
      window.alert(`Sorry, there was an error trying to save.  Check to make sure you are online and the owner of this Enduro.`)
    }
  } else {
    try {
      const docRef = await addDoc(collection(db, "enduros"), {
        //id: will be auto-generated by Firestore
        userId: getFirebase().auth.currentUser?.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPublished,
        ...json
      });
      routeId = docRef.id
      console.log(`Created new enduro ${docRef.id}`)
    } catch (e) {
      console.error('Failed to create new enduro')
      console.error(e)
    }
  }
  updatePublishButton()
}

async function togglePublishState() {
  console.log('publishing')
  isPublished = !isPublished
  await saveEnduro()
  if (isPublished) {
    alert('Enduro is now public for others to view.')
  } else {
    alert('Enduro is no longer public.')
  }
}

function updatePublishButton() {
  const button = $('#publish')
  
  // Unsaved enduros cannot be published, avoids tons of dead enduros
  if (routeId === null) {
    button.hide()
    return
  }

  // If saved, button becomes a toggle to publish or unpublish
  button.show()

  if (isPublished) {
    button.text('Un-Publish')
  } else {
    button.text('Publish')
  }
}