import type {FeatureCollectionWithDate} from "./interfaces.ts";
import {VegreferanseService} from "./vegrefService.js";
import {UtilClass} from "./utilClass.js";
import {Vegreferanse} from "./vegreferanse.js";
import type {Vegobjekt, HistoricVegobjektResponse} from "./nvdbTypes.js";


const service = new VegreferanseService();

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

        service.setBaseUrl("http://localhost:8080");
        service.findVegreferanse(Vegreferanse.createFromString("" + "0800" + kat + stat + vegnr + "hp" + hp + "m" + meter))
            .then(async response => {

                displayResults(response);

                response.objekter?.forEach(objekt => {
                    let vegref = UtilClass.toVegreferanse(objekt);

                    var stedfesting = objekt.lokasjon.stedfestinger[0];
                    console.log(`Objekt id: ${objekt.id},`
                        + ` versjon:  ${objekt.metadata.versjon}, `
                        + ` startdato: ${objekt.metadata.startdato}, `
                        + ` sluttdato: ${objekt.metadata.sluttdato}, `
                        + ` stedfesting: ${stedfesting ? `${stedfesting.startposisjon}-${stedfesting.sluttposisjon}@${stedfesting.veglenkesekvensid}` : 'N/A'}, `
                        + ` Vegreferanse: ${vegref}, `
                        // + ` geometri: ${objekt.lokasjon.geometri.wkt}`
                    );
                });
            });
    }
}


async function handleLenkesekvensSearch(event: Event) {
    event.preventDefault();

    const linkid = parseFloat((document.getElementById('lenkesekvensId') as HTMLInputElement).value || '0');
    const position = parseFloat((document.getElementById('posisjon') as HTMLInputElement).value);

    if (linkid && position) {
        try {
            showLoading();

            service.findHistoricVegreferanseByLenkeposisjon(linkid, position)
                .then(async posisjoner => {

                    displayResults(posisjoner);

                    posisjoner.objekter?.forEach(objekt => {
                        const vegref = UtilClass.toVegreferanse(objekt);
                        var stedfesting = objekt.lokasjon.stedfestinger[0];
                        console.log(`Objekt id: ${objekt.id},`
                            + ` versjon:  ${objekt.metadata.versjon}, `
                            + ` startdato: ${objekt.metadata.startdato}, `
                            + ` sluttdato: ${objekt.metadata.sluttdato}, `
                            + ` stedfesting: ${stedfesting ? `${stedfesting.startposisjon}-${stedfesting.sluttposisjon}@${stedfesting.veglenkesekvensid}` : 'N/A'}, `
                            + ` Vegreferanse: ${vegref} `
                            + ` geometri: ${objekt.lokasjon.geometri.wkt}`);
                    });
                });

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

        var vegobjekter: Vegobjekt[] = [];

        service.findPosisjonByNordOst(northing, easting).then(async posisjoner => {
            posisjoner.forEach((posisjon) => {
                service.findHistoricVegreferanseByLenkeposisjon(posisjon.veglenkesekvens.veglenkesekvensid, posisjon.veglenkesekvens.relativPosisjon)
                    .then(vegobjektResponse => {
                        vegobjektResponse.objekter?.forEach(objekt => {

                            vegobjekter.push(objekt);

                            const vegref = UtilClass.toVegreferanse(objekt);
                            var stedfesting = objekt.lokasjon.stedfestinger[0];
                            console.log(`Objekt id: ${objekt.id},`
                                + ` versjon:  ${objekt.metadata.versjon}, `
                                + ` startdato: ${objekt.metadata.startdato}, `
                                + ` sluttdato: ${objekt.metadata.sluttdato}, `
                                + ` stedfesting: ${stedfesting ? `${stedfesting.startposisjon}-${stedfesting.sluttposisjon}@${stedfesting.veglenkesekvensid}` : 'N/A'}, `
                                + ` Vegreferanse: ${vegref} `
                                + ` geometri: ${objekt.lokasjon.geometri.wkt}`
                            );

                            displayResults({
                                objekter: vegobjekter,
                                metadata: {
                                    antallTreffTotalt: 0,
                                    antallTreffPerSide: 0,
                                    side: 0,
                                    antallSider: 0
                                },
                            });
                        });
                    });
            });
        });
    }
}

async function getLinksFromV4(result: FeatureCollectionWithDate) {
    let linkIds = result.features.map(feature => feature.properties.veglenkeposisjon + "@" + feature.properties.veglenkeid);
    // return await hentvegref.veglenkesekvensLesV4({linkIds: linkIds});
}

function showLoading() {
    const elementById = document.getElementById('results');
    if (elementById) elementById.innerHTML = '<p>Søker...</p>';
}

async function displayResults(result: HistoricVegobjektResponse) {
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
            '<th>Koordinater</th>' +
            '<th>Dagens vegsystemreferanse</th>' +
            '</tr>' +
            '</thead>' +
            '<tbody>';

        let lastVeglenkeid: number = -1;
        let rowClass = '';

        result.objekter.forEach(feature => {

            let veglenkeid = feature.lokasjon.stedfestinger[0]?.veglenkesekvensid || -1;

            if (veglenkeid !== lastVeglenkeid) {
                // Alternate row color when veglenkeid changes
                rowClass = rowClass === 'grey1' ? 'grey2' : 'grey1';
                lastVeglenkeid = veglenkeid;
            }


            const vegref = UtilClass.toVegreferanse(feature);
            var stedfesting = feature.lokasjon.stedfestinger[0];

            html += `<tr class="${rowClass}">
            <td>${vegref || 'N/A'}</td>
            <td>${feature.metadata.startdato || 'N/A'}</td>
            <td>${feature.metadata.sluttdato || 'N/A'}</td>
            <td>${stedfesting ? `${stedfesting.startposisjon}-${stedfesting.sluttposisjon}@${stedfesting.veglenkesekvensid}` : 'N/A'}</td>
            <td>
            
</td>
            <td>${feature.lokasjon.vegsystemreferanser.at(0)?.kortform}</td>
            </tr>`;

        });
        html += '</tbody></table>';
        resultsDiv.innerHTML = html;
    }
}

function displayError(message: string) {
    (document.getElementById('results') as HTMLElement).innerHTML = `<p style="color: red;">${message}</p>`;
}
