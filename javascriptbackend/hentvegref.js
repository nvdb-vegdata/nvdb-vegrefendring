// hentvegref.js

const axios = require('axios');
const xml2js = require('xml2js');

function sjekkdatoer(fra, til, dato) {
    fra = parseInt(fra.replace(/\D+/g, ''));
    til = parseInt(til.replace(/\D+/g, ''));
    dato = parseInt(dato.replace(/\D+/g, ''));
    return dato >= fra && dato < til;
}

function vvi2vegrefstring(vegref) {
    return vegref.TextualRoadReference.slice(0, 4) + ' ' +
        vegref.RoadCategory + vegref.RoadStatus.toLowerCase() +
        vegref.RoadNumber + ' ' +
        'hp' + vegref.RoadNumberSegment +
        ' m' + vegref.RoadNumberSegmentDistance;
}

function vegref2geojson(vegref) {
    const vegstr = vvi2vegrefstring(vegref);
    const fradato = vegref.ValidFrom.slice(0, 10);
    const tildato = vegref.ValidTo.slice(0, 10);
    const veglenkeid = vegref.ReflinkOID;
    const veglenkeposisjon = Math.round(parseFloat(vegref.Measure) * 1e8) / 1e8;

    const X = parseFloat(vegref.RoadNetPosition.X);
    const Y = parseFloat(vegref.RoadNetPosition.Y);
    const coordinates = [X, Y];
    if (vegref.RoadNetPosition.Z) {
        coordinates.push(parseFloat(vegref.RoadNetPosition.Z));
    }

    return {
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: coordinates
        },
        properties: {
            vegref: vegstr,
            fradato: fradato,
            tildato: tildato,
            veglenkeid: veglenkeid,
            veglenkeposisjon: veglenkeposisjon
        }
    };
}

async function henthistorikk({ fylke = 15, kommune = 0, kat = 'E', stat = 'V', vegnr = 39, hp = 29, meter = 7618 }) {
    const vegref = String(fylke).padStart(2, '0') +
        String(kommune).padStart(2, '0') +
        kat.toUpperCase() + stat.toUpperCase() +
        String(vegnr).padStart(5, '0') +
        String(hp).padStart(3, '0') +
        String(meter).padStart(5, '0');

    const url = 'https://visveginfo-static.opentns.org/RoadInfoService3d/GetRoadReferenceHistoryForReference';
    const params = { roadReference: vegref };

    const response = await axios.get(url, { params });
    if (response.status === 200 && response.data.includes('<RoadPointReferenceWithTimePeriod>')) {
        const parser = new xml2js.Parser({ explicitArray: false });
        const data = await parser.parseStringPromise(response.data);
        const p1 = 'ArrayOfRoadPointReferenceWithTimePeriod';
        const p2 = 'RoadPointReferenceWithTimePeriod';

        let resultatliste = [];
        if (typeof data[p1][p2] === 'object' && !Array.isArray(data[p1][p2])) {
            resultatliste.push(vegref2geojson(data[p1][p2]));
        } else if (Array.isArray(data[p1][p2])) {
            for (const envegref of data[p1][p2]) {
                resultatliste.push(vegref2geojson(envegref));
            }
        }

        return {
            type: "FeatureCollection",
            features: resultatliste
        };
    }
    return { type: "FeatureCollection", features: [] };
}

module.exports = { henthistorikk };