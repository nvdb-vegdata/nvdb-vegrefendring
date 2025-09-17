class VegreferanseApp {
    constructor() {
        this.initEventListeners();
        this.hentvegref = new HentVegref();
    }

    initEventListeners() {
        document.getElementById('vegrefForm').addEventListener('submit', this.handleVegrefSearch.bind(this));
        document.getElementById('posForm').addEventListener('submit', this.handlePosSearch.bind(this));
        document.getElementById('lenkeForm').addEventListener('submit', this.handleLenkesekvensSearch.bind(this));

        ['vegrefForm', 'posForm', 'lenkeForm'].forEach(formId => {
            document.getElementById(formId).addEventListener('reset', function (e) {
                e.preventDefault();
                this.querySelectorAll('input').forEach(input => input.value = '');
                this.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
            });
        });
    }

    async handleVegrefSearch(event) {
        event.preventDefault();

        const fylke = parseInt(document.getElementById('fylke').value);
        const kat = document.getElementById('kat').value;
        const vegnr = parseInt(document.getElementById('vegnr').value);
        const hp = parseInt(document.getElementById('hp').value) || 1;
        const meter = parseInt(document.getElementById('meter').value) || 0;

        if (fylke && kat && vegnr) {
            try {
                this.showLoading();
                const result = await this.hentvegref.henthistorikk({
                    fylke,
                    kommune: '00',
                    kat,
                    stat: 'V',
                    vegnr,
                    hp,
                    meter,
                    valgtdato: '',
                    crs: 25833,
                    fjerndubletter: false,
                    dagensverdi: false
                });

                // Do a position@roadref search to get all roadrefs for that road
                if (result.features.length === 0) {
                    this.displayResults(result);
                } else {
                    const promises = result.features.map(feature => {
                        const linkid = feature.properties.veglenkeid;
                        const position = feature.properties.veglenkeposisjon;
                        return this.hentvegref.veglenkesekvens({
                            linkid: linkid,
                            position: position
                        });
                    });
                    const data = (await Promise.all([...new Set(promises)]))
                        .sort((a, b) => {
                            // Sort by fradato, then by veglenkeid
                            const dateA = a.features[0]?.properties.fradato || '';
                            const dateB = b.features[0]?.properties.fradato || '';
                            if (dateA !== dateB) {
                                return dateA.localeCompare(dateB);
                            }
                            const veglenkeA = a.features[0]?.properties.veglenkeid || '';
                            const veglenkeB = b.features[0]?.properties.veglenkeid || '';
                            return veglenkeA.localeCompare(veglenkeB);
                        })
                        // Extract features from each result and flatten into a single array
                        .map(d => d.features).flat()

                    this.displayResults({
                        type: 'FeatureCollection',
                        features: data,
                    });
                }
            } catch (error) {
                this.displayError('Feil ved søk på vegreferanse: ' + error.message);
            }
        }
    }


    async getLinksFromV4(result) {
        let linkIds = result.features.map(feature => feature.properties.veglenkeposisjon + "@" + feature.properties.veglenkeid);
        return await this.hentvegref.veglenkesekvensLesV4({linkIds: linkIds});
    }

    async handleLenkesekvensSearch(event) {
        event.preventDefault();

        const linkid = parseFloat(document.getElementById('lenkesekvensId').value);
        const position = parseFloat(document.getElementById('posisjon').value);

        if (linkid && position) {
            try {
                this.showLoading();
                const result = await this.hentvegref.veglenkesekvens({
                    linkid: linkid,
                    position: position,
                });
                this.displayResults(result);
            } catch (error) {
                this.displayError('Feil ved søk på posisjon: ' + error.message);
            }
        }
    }

    async handlePosSearch(event) {
        event.preventDefault();

        const easting = parseFloat(document.getElementById('easting').value);
        const northing = parseFloat(document.getElementById('northing').value);

        if (easting && northing) {
            try {
                this.showLoading();
                const result = await this.hentvegref.vegrefkoordinat({
                    easting,
                    northing,
                    valgtdato: '',
                    crs: 25833,
                    fjerndubletter: false
                });

                // Do a position@roadref search to get all roadrefs for that road
                if (result.features.length === 0) {
                    this.displayResults(result);
                } else {
                    const firstFeature = result.features[0];
                    const linkid = firstFeature.properties.veglenkeid;
                    const position = firstFeature.properties.veglenkeposisjon;
                    this.displayResults(await this.hentvegref.veglenkesekvens({
                        linkid: linkid,
                        position: position
                    }));
                }
            } catch (error) {
                this.displayError('Feil ved søk på posisjon: ' + error.message);
            }
        }
    }

    showLoading() {
        document.getElementById('results').innerHTML = '<p>Søker...</p>';
    }

    async displayResults(result) {
        const resultsDiv = document.getElementById('results');
        if (result.features && result.features.length === 0) {
            resultsDiv.innerHTML = '<p>Ingen resultater funnet.</p>';
        } else {

            // Fetch lenke data to get vegsystemreferanse
            const lenkeData = await this.getLinksFromV4(result)
            result.features = result.features
                .map(feature => {
                    let findLast = lenkeData.features.findLast(lenkeData =>
                        Number(feature.properties.veglenkeid) === lenkeData.properties.veglenkesekvens.veglenkesekvensid  &&
                        Number(feature.properties.veglenkeposisjon) === lenkeData.properties.veglenkesekvens.relativPosisjon);
                    return {
                        "geometry": feature.geometry,
                        "properties": feature.properties,
                        "vegsystemreferanse": findLast?.properties.vegsystemreferanse,
                        "type": "Feature",
                    }
                })

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

            let lastVeglenkeid = null;
            let rowClass = '';


            result.features.forEach(feature => {
                if (feature.properties.veglenkeid !== lastVeglenkeid) {
                    // Alternate row color when veglenkeid changes
                    rowClass = rowClass === 'grey1' ? 'grey2' : 'grey1';
                    lastVeglenkeid = feature.properties.veglenkeid;
                }

                html += `<tr class="${rowClass}">
                    <td>${feature.properties.vegref || 'N/A'}</td>
                    <td>${feature.properties.fradato || 'N/A'}</td>
                    <td>${feature.properties.tildato || 'N/A'}</td>
                    <td>${feature.properties.veglenkeposisjon}@${feature.properties.veglenkeid}</td>
                    <td>${feature.geometry.coordinates.join(', ')}</td>
                    <td>${feature.vegsystemreferanse?.kortform}</td>
                </tr>`;
            });
            html += '</tbody></table>';
            resultsDiv.innerHTML = html;
        }
    }

    displayError(message) {
        document.getElementById('results').innerHTML = `<p style="color: red;">${message}</p>`;
    }
}

// Start appen når siden er lastet
document.addEventListener('DOMContentLoaded', () => {
    new VegreferanseApp();
});
