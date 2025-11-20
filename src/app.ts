import {VegreferanseService} from "./vegrefService.js";
import {Vegreferanse} from "./vegreferanse.js";
import type {VegrefAndVegsystemreferanse} from "./nvdbTypes.js";
import {VegrefController} from "./vegrefController.js";


// TODO: Remove API Les V4 on localhost:8080
new VegreferanseService().setBaseUrl("http://localhost:8080");

var vegrefController = new VegrefController();

document.getElementById('vegrefForm')?.addEventListener('submit', handleVegrefSearch);
document.getElementById('posForm')?.addEventListener('submit', handlePosSearch);
document.getElementById('lenkeForm')?.addEventListener('submit', handleLenkesekvensSearch);

['vegrefForm', 'posForm', 'lenkeForm'].forEach(formId => {
    document.getElementById(formId)?.addEventListener('reset', function (e) {
        e.preventDefault();
        this.querySelectorAll('input').forEach(input => input.value = '');
        this.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
    });
});

async function handleVegrefSearch(event: Event) {
    event.preventDefault();

    const fylke = parseInt((document.getElementById('fylke') as HTMLInputElement)?.value || '0');
    const kat = (document.getElementById('kat') as HTMLInputElement)?.value || 'E';
    const stat = (document.getElementById('stat') as HTMLInputElement)?.value || 'V';
    const vegnr = parseInt((document.getElementById('vegnr') as HTMLInputElement)?.value || '0');
    const hp = parseInt((document.getElementById('hp') as HTMLInputElement)?.value || '1');
    const meter = parseInt((document.getElementById('meter') as HTMLInputElement)?.value || '0');

    if (fylke && kat && vegnr) {
        showLoading();
        var vegreferanse = Vegreferanse.createFromString("" + "0800" + kat + stat + vegnr + "hp" + hp + "m" + meter);
        displayResults(await vegrefController.findPosisjoner(vegreferanse));
    }
}

async function handleLenkesekvensSearch(event: Event) {
    event.preventDefault();

    const linkid = parseFloat((document.getElementById('lenkesekvensId') as HTMLInputElement).value || '0');
    const position = parseFloat((document.getElementById('posisjon') as HTMLInputElement).value);

    if (linkid && position) {
        try {
            showLoading();
            displayResults(await vegrefController.findPosisjonerByLenkesekvens(linkid, position));
        } catch (error: unknown) {
            if (error instanceof Error) {
                displayError('Feil ved søk på posisjon: ' + error.message);
            } else {
                displayError('Feil ved søk på posisjon.');
            }
        }
    }
}


async function handlePosSearch(event: Event) {
    event.preventDefault();

    const easting = parseFloat((document.getElementById('easting') as HTMLInputElement)?.value || '0');
    const northing = parseFloat((document.getElementById('northing') as HTMLInputElement)?.value || '0');

    if (easting && northing) {
        showLoading();
        displayResults(await vegrefController.findPosisjonerByCoordinates(northing, easting));
    }
}

function showLoading() {
    const elementById = document.getElementById('results');
    if (elementById) elementById.innerHTML = '<p>Søker...</p>';
}

async function displayResults(result: VegrefAndVegsystemreferanse[]) {
    const resultsDiv = (document.getElementById('results') as HTMLDivElement);
    // if (result.objekter.length == 0) {
    //     if (resultsDiv) resultsDiv.innerHTML = '<p>Ingen resultater funnet.</p>';
    // } else {
    {

        // Fetch lenke data to get vegsystemreferanse
        ///const lenkeData = await getLinksFromV4(result)

        let html = '<h3>Resultater:</h3>' +
            '<table class="results-table" border="1">' +
            '<thead>' +
            '<tr>' +
            '<th>Vegreferanse</th>' +
            '<th>Fra dato</th>' +
            '<th>Til dato</th>' +
            '<th>Veglenkeposisjon</th>' +
            '<th>Relativ posisjon</th>' +
            '<th>Koordinat</th>' +
            '<th>Dagens vegsystemreferanse</th>' +
            '</tr>' +
            '</thead>' +
            '<tbody>';

        let lastVeglenkeid: number = -1;
        let rowClass = '';

        result.forEach(feature => {
            html += `<tr class="${rowClass}">
            <td>${feature.vegreferanse}</td>
            <td>${feature.fraDato}</td>
            <td>${feature.tilDato}</td>
            <td>${feature.veglenkeposisjon}</td>
            <td>${feature.relativPosisjon}</td>
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
