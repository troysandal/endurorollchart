import { getEnduro, getEnduroID } from '../firebase'
import Enduro from "../timekeeping/enduro";
import JART from "../timekeeping/jart";
import { fromJSON } from "../timekeeping/serializeJSON";
import { JARTViewer } from "./jart.view";

let enduro: Enduro

function showJART() {
    if (!enduro) { return }

    $('#container').empty();
    const useZeroStartMinute = $<HTMLInputElement>('#zeroKeyTime')[0].checked;
    const timeInLeftColumn = $<HTMLInputElement>('#timeInLeftColumn')[0].checked;
    const jart = new JART();
    jart.createFromEnduro(enduro, useZeroStartMinute);
    new JARTViewer(enduro, jart, $('#container'), 3, timeInLeftColumn);
}

$('#zeroKeyTime').on('click', function () {
    showJART();
})

$('#timeInLeftColumn').on('click', function () {
    showJART();
})


async function init() {
    const id = getEnduroID()

    if (id !== null) {
        const routeJSON = await getEnduro(id)
        enduro = fromJSON(routeJSON)

        showJART();
    }
}

init()