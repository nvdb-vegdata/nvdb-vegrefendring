import {Vegreferanse} from "./vegreferanse.js";
import type {VegrefAndVegsystemreferanse} from "./nvdbTypes.js";
import {VegrefController} from "./vegrefController.js";
import {UtilClass} from "./utilClass.js";


var vegrefController = new VegrefController();

document.getElementById('vegrefForm')?.addEventListener('submit', handleVegrefSearch);
document.getElementById('vegsysrefForm')?.addEventListener('submit', handleVegsysrefSearch);
document.getElementById('posForm')?.addEventListener('submit', handlePosSearch);
document.getElementById('lenkeForm')?.addEventListener('submit', handleLenkesekvensSearch);

['vegrefForm', 'posForm', 'lenkeForm', 'vegsysrefForm'].forEach(formId => {
    document.getElementById(formId)?.addEventListener('reset', function (e) {
        e.preventDefault();
        this.querySelectorAll('input').forEach(input => input.value = '');
        this.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
    });
});

async function handleVegrefSearch(event: Event) {
    event.preventDefault();

    const fylke = parseInt((document.getElementById('fylke') as HTMLInputElement)?.value || '0');
    const kommune = parseInt((document.getElementById('kommune') as HTMLInputElement)?.value || '0');
    const kat = (document.getElementById('kat') as HTMLInputElement)?.value || 'E';
    const stat = (document.getElementById('stat') as HTMLInputElement)?.value || 'V';
    const vegnr = parseInt((document.getElementById('vegnr') as HTMLInputElement)?.value || '0');
    const hp = parseInt((document.getElementById('hp') as HTMLInputElement)?.value || '1');
    const meter = parseInt((document.getElementById('meter') as HTMLInputElement)?.value || '0');
    const tidspunkt = (document.getElementById('vegrefForm_dato') as HTMLInputElement)?.value
        ? new Date((document.getElementById('vegrefForm_dato') as HTMLInputElement).value)
        : undefined;

    if (fylke && kat && vegnr) {
        showLoading();
        var vegreferanse = Vegreferanse.createFromString(""
            + (fylke ? UtilClass.padNumber(fylke, 2) : '00')
            + (kommune ? UtilClass.padNumber(kommune, 2) : '00')
            + kat
            + stat
            + vegnr
            + "hp" + hp
            + "m" + meter);
        displayResults(await vegrefController.findPosisjonerByVegreferanse(vegreferanse, tidspunkt));
    }
}


async function handleLenkesekvensSearch(event: Event) {
    event.preventDefault();

    const linkid = parseFloat((document.getElementById('lenkesekvensId') as HTMLInputElement).value || '0');
    const position = parseFloat((document.getElementById('posisjon') as HTMLInputElement).value);
    const tidspunkt = (document.getElementById('lenkeForm_dato') as HTMLInputElement)?.value
        ? new Date((document.getElementById('lenkeForm_dato') as HTMLInputElement).value)
        : undefined;

    if (linkid && position) {
        try {
            showLoading();
            displayResults(await vegrefController.findPosisjonerByLenkesekvens(linkid, position, tidspunkt));
        } catch (error: unknown) {
            if (error instanceof Error) {
                displayError('Feil ved søk på posisjon: ' + error.message);
            } else {
                displayError('Feil ved søk på posisjon.');
            }
        }
    }
}

async function handleVegsysrefSearch(event: Event) {
    event.preventDefault();

    const fylke = parseInt((document.getElementById('fylke2') as HTMLInputElement)?.value) || undefined;
    const kommune = parseInt((document.getElementById('kommune2') as HTMLInputElement)?.value) || undefined;
    const kat = (document.getElementById('kat2') as HTMLInputElement)?.value || 'E';
    const stat = (document.getElementById('stat2') as HTMLInputElement)?.value || 'V';
    const vegnr = parseInt((document.getElementById('vegnr2') as HTMLInputElement)?.value || '0');
    const strekning = parseInt((document.getElementById('strekning') as HTMLInputElement)?.value || '1');
    const delstrekning = parseInt((document.getElementById('delstrekning') as HTMLInputElement)?.value || '1');
    const meter = parseInt((document.getElementById('meter2') as HTMLInputElement)?.value || '0');
    const tidspunkt = (document.getElementById('vegsysrefForm_dato') as HTMLInputElement)?.value
        ? new Date((document.getElementById('vegsysrefForm_dato') as HTMLInputElement).value)
        : undefined;


    showLoading();
    var vegsystemreferanse = ""
        + (fylke ? UtilClass.padNumber(fylke, 2) : "")
        + (kommune ? UtilClass.padNumber(kommune, 2) : "")
        + kat
        + stat
        + vegnr
        + "s"
        + strekning.toString()
        + "d"
        + delstrekning.toString()
        + "m"
        + meter.toString();


    // Ekstra type
    const extraType = (document.getElementById('extraType') as HTMLSelectElement)?.value;

    // Sideanlegg
    const sideanleggsdel = parseInt((document.getElementById('sideanleggsdel') as HTMLInputElement)?.value || '0');
    const sideanleggsdel_meter = parseInt((document.getElementById('sideanleggsdel_meter') as HTMLInputElement)?.value || '0');

    // Kryssdel
    const kryssdel = parseInt((document.getElementById('kryssdel') as HTMLInputElement)?.value || '0');
    const kryssdel_meter = parseInt((document.getElementById('kryssdel_meter') as HTMLInputElement)?.value || '0');

    if (extraType !== "Ingen") {
        if (extraType == "sideanlegg" && sideanleggsdel > 0) {
            vegsystemreferanse += "sd" + sideanleggsdel.toString() + "m" + sideanleggsdel_meter.toString();
        } else if (kryssdel > 0) {
            vegsystemreferanse += "kd" + kryssdel.toString() + "m" + kryssdel_meter.toString();
        }
    }

    displayResults(await vegrefController.findPosisjonerByVegsystemreferanse(vegsystemreferanse, tidspunkt));
}


async function handlePosSearch(event: Event) {
    event.preventDefault();

    const easting = parseFloat((document.getElementById('easting') as HTMLInputElement)?.value || '0');
    const northing = parseFloat((document.getElementById('northing') as HTMLInputElement)?.value || '0');
    const tidspunkt = (document.getElementById('posForm_dato') as HTMLInputElement)?.value
        ? new Date((document.getElementById('posForm_dato') as HTMLInputElement).value)
        : undefined;


    if (easting && northing) {
        showLoading();
        displayResults(await vegrefController.findPosisjonerByCoordinates(northing, easting, tidspunkt));
    }
}

function showLoading() {
    const elementById = document.getElementById('results');
    if (elementById) elementById.innerHTML = '<p>Søker...</p>';
}

async function displayResults(result: VegrefAndVegsystemreferanse[]) {
    const resultsDiv = (document.getElementById('results') as HTMLDivElement);
    if (result.length == 0) {
        if (resultsDiv) resultsDiv.innerHTML = '<p>Ingen resultater funnet.</p>';
    } else {
        let html = '<h3>Resultater:</h3>' +
            '<table class="results-table" border="1">' +
            '<thead>' +
            '<tr>' +
            '<th>Vegreferanse</th>' +
            '<th>Vegreferanse <br>(Objekttype 532)</th>' +
            '<th>Veglenkeposisjon <br>( 532 )</th>' +
            '<th>Fa dato <br>( 532 )</th>' +
            '<th>Til dato <br>( 532 )</th>' +
            '<th>Veglenkeposisjon</th>' +
            '<th>Koordinat</th>' +
            '<th>Dagens vegsystemreferanse</th>' +
            '</tr>' +
            '</thead>' +
            '<tbody>';

        let lastVeglenkeid: number = -1;
        let rowClass = '';

        result
            .slice()
            .sort((a, b) => {
                if (a.veglenkeid !== b.veglenkeid) {
                    return a.veglenkeid - b.veglenkeid;
                }
                const dateA = new Date(a.fraDato).getTime();
                const dateB = new Date(b.fraDato).getTime();
                return dateA - dateB;
            })
            .forEach(feature => {
                if (feature.veglenkeid !== lastVeglenkeid) {
                    lastVeglenkeid = feature.veglenkeid;
                    rowClass = rowClass === 'grey1' ? 'grey2' : 'grey1';
                }
                html += `<tr class="${rowClass}">
            <td>${feature.beregnetVegreferanse}</td>
            <td>${feature.vegreferanse}</td>
            <td>${feature.veglenkeposisjon}</td>
            <td>${feature.fraDato}</td>
            <td>${feature.tilDato}</td>
            <td>${UtilClass.formatNumber(feature.relativPosisjon,6)}@${feature.veglenkeid}</td>
            <td>${feature.koordinat}</td>
            <td>${feature.vegsystemreferanse}</td>
            </tr>`;
            });
        html += '</tbody></table>';
        resultsDiv.innerHTML = html;
    }
}

function displayError(message: string) {
    (document.getElementById('results') as HTMLElement).innerHTML = `<p style="color: red;">${message}</p>`;
}
