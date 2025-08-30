// pythonbackend/my_flask_app.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const hentvegref = require('./hentvegref');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
    const mappe = '/home/hansgu/IdeaProjects/vegrefendring/javascriptbackend';
    fs.readFile('infotekst.html', 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading file');
        res.send(data);
    });
});

app.get('/vviwrapper/status', async (req, res) => {
    const url = 'https://visveginfo-static.opentns.org/status';
    try {
        const r = await axios.get(url);
        let mytext = 'Ikke sjekket dato!';
        if (r.status === 200 && r.data.Datasets) {
            const ml = r.data.Datasets.filter(em => em.Dataset === "tne_ft_vegreferanse_532_10");
            if (ml.length > 0 && ml[0].LastNVDBTransaction) {
                mytext = ml[0].LastNVDBTransaction;
            }
        }
        res.send(mytext);
    } catch (err) {
        res.send('Ikke sjekket dato!');
    }
});

app.get('/vegreferanse', async (req, res) => {
    let {
        fylke = '',
        kommune = '00',
        kat = '',
        stat = 'V',
        vegnr = '',
        hp = 1,
        meter = 0,
        dato: valgtdato = '',
        fjerndubletter = '',
        hentdagensverdi = '',
        crs = 25833
    } = req.query;

    fjerndubletter = fjerndubletter.toLowerCase() === 'true';
    hentdagensverdi = hentdagensverdi.toLowerCase() === 'true';

    fylke = parseInt(fylke) || null;
    vegnr = parseInt(vegnr) || null;

    let vegref;
    if (fylke && kat && vegnr) {
        vegref = await hentvegref.henthistorikk({
            fylke,
            kommune,
            kat,
            stat,
            vegnr,
            hp,
            meter,
            valgtdato,
            crs,
            fjerndubletter,
            dagensverdi: hentdagensverdi
        });
    } else {
        vegref = { type: 'FeatureCollection', features: [] };
    }
    res.json(vegref);
});

app.get('/posisjon', async (req, res) => {
    let {
        ost: easting = '',
        nord: northing = '',
        dato: valgtdato = '',
        fjerndubletter = '',
        crs = 25833
    } = req.query;

    fjerndubletter = fjerndubletter.toLowerCase() === 'true';
    easting = parseFloat(easting) || null;
    northing = parseFloat(northing) || null;

    let vegref;
    if (easting && northing) {
        vegref = await hentvegref.vegrefkoordinat({
            easting,
            northing,
            valgtdato,
            crs,
            fjerndubletter
        });
    } else {
        vegref = { type: 'FeatureCollection', features: [] };
    }
    res.json(vegref);
});

app.listen(5000, () => {
    console.log('Server running on port 5000');
});