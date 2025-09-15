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
                    const firstFeature = result.features[0];
                    const linkid = firstFeature.properties.veglenkeid;
                    const position = firstFeature.properties.veglenkeposisjon;
                    this.displayResults(await this.hentvegref.veglenkesekvens({linkid, position: 0}));
                }

            } catch (error) {
                this.displayError('Feil ved søk på vegreferanse: ' + error.message);
            }
        }
    }


    async handleLenkesekvensSearch(event) {
        event.preventDefault();

        const linkid = parseFloat(document.getElementById('lenkesekvensId').value);
        const position = parseFloat(document.getElementById('posisjon').value);

        if (easting && northing) {
            try {
                this.showLoading();
                const result = await this.hentvegref.veglenkesekvens({
                    linkid,
                    position: position || 0,
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
                    this.displayResults(await this.hentvegref.veglenkesekvens({linkid, position: 0}));
                }
            } catch (error) {
                this.displayError('Feil ved søk på posisjon: ' + error.message);
            }
        }
    }

    showLoading() {
        document.getElementById('results').innerHTML = '<p>Søker...</p>';
    }

    displayResults(data) {
        const resultsDiv = document.getElementById('results');
        if (data.features && data.features.length > 0) {
            let html = '<h3>Resultater:</h3><table class="results-table" border="1">' +
                '<thead><tr><th>Vegreferanse</th><th>Fra dato</th><th>Til dato</th><th>Veglenkeposisjon</th><th>Koordinater</th></tr></thead><tbody>';
            data.features.forEach(feature => {
                const props = feature.properties;
                html += `<tr>
                    <td>${props.vegref || 'N/A'}</td>
                    <td>${props.fradato || 'N/A'}</td>
                    <td>${props.tildato || 'N/A'}</td>
                    <td>${props.veglenkeposisjon}@${props.veglenkeid}</td>
                    <td>${feature.geometry.coordinates.join(', ')}</td>
                </tr>`;
            });
            html += '</tbody></table>';
            resultsDiv.innerHTML = html;
        } else {
            resultsDiv.innerHTML = '<p>Ingen resultater funnet.</p>';
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
