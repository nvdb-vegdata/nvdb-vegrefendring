class HentVegref {
    constructor() {
        this.baseUrl = 'https://visveginfo-static.opentns.org';
    }

    async fetchXML(url) {
        try {
            const response = await fetch(url, {
                mode: 'cors',
                headers: {
                    'Accept': 'application/xml, text/xml'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const xmlText = await response.text();
            const parser = new DOMParser();
            return parser.parseFromString(xmlText, 'text/xml');
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    async henthistorikk(params) {
        const { fylke, kommune, kat, stat, vegnr, hp, meter } = params;
        const vegref = `${fylke.toString().padStart(2, '0')}${kommune.padStart(2, '0')}${kat.toUpperCase()}${stat.toUpperCase()}${vegnr.toString().padStart(5, '0')}${hp.toString().padStart(3, '0')}${meter.toString().padStart(5, '0')}`;

        const url = `${this.baseUrl}/RoadInfoService3d/GetRoadReferenceHistoryForReference?roadReference=${vegref}`;

        try {
            const xmlDoc = await this.fetchXML(url);
            return this.parseXMLToGeoJSON(xmlDoc, false);
        } catch (error) {
            console.error('Error in henthistorikk:', error);
            return { type: 'FeatureCollection', features: [] };
        }
    }

    async vegrefkoordinat(params) {
        const { easting, northing } = params;
        const url = `${this.baseUrl}/RoadInfoService3d/GetRoadReferenceHistoryForLocation?easting=${easting}&northing=${northing}&TopologyLevel=Overview&searchRoadStatus=V,W,T,G,A,B,H,S,M,P,X,E,U,Q`;

        try {
            const xmlDoc = await this.fetchXML(url);
            return this.parseXMLToGeoJSON(xmlDoc, false);
        } catch (error) {
            console.error('Error in vegrefkoordinat:', error);
            return { type: 'FeatureCollection', features: [] };
        }
    }

    parseXMLToGeoJSON(xmlDoc, dagensverdi) {
        const features = [];
        const roadPointRefs = xmlDoc.getElementsByTagName('RoadPointReferenceWithTimePeriod');

        for (let i = 0; i < roadPointRefs.length; i++) {
            const roadPointRef = roadPointRefs[i];
            const feature = this.xmlElementToGeoJSON(roadPointRef, dagensverdi);
            if (feature) {
                features.push(feature);
            }
        }

        return {
            type: 'FeatureCollection',
            features: features
        };
    }

    xmlElementToGeoJSON(element, dagensverdi) {
        try {
            const getElementText = (tagName) => {
                const el = element.getElementsByTagName(tagName)[0];
                return el ? el.textContent : '';
            };

            const vegref = this.createVegrefString(element);
            const fradato = getElementText('ValidFrom').substring(0, 10);
            const tildato = getElementText('ValidTo').substring(0, 10);
            const veglenkeid = getElementText('ReflinkOID');
            const veglenkeposisjon = Math.round(parseFloat(getElementText('Measure')) * 100000000) / 100000000;

            const positionEl = element.getElementsByTagName('RoadNetPosition')[0];
            if (!positionEl) return null;

            const x = parseFloat(positionEl.getElementsByTagName('X')[0].textContent);
            const y = parseFloat(positionEl.getElementsByTagName('Y')[0].textContent);
            const coordinates = [x, y];

            const zEl = positionEl.getElementsByTagName('Z')[0];
            if (zEl) {
                coordinates.push(parseFloat(zEl.textContent));
            }

            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: coordinates
                },
                properties: {
                    vegref: vegref,
                    fradato: fradato,
                    tildato: tildato,
                    veglenkeid: veglenkeid,
                    veglenkeposisjon: veglenkeposisjon
                }
            };
        } catch (error) {
            console.error('Error parsing XML element:', error);
            return null;
        }
    }

    createVegrefString(element) {
        const getElementText = (tagName) => {
            const el = element.getElementsByTagName(tagName)[0];
            return el ? el.textContent : '';
        };

        const textualRef = getElementText('TextualRoadReference').substring(0, 4);
        const roadCategory = getElementText('RoadCategory');
        const roadStatus = getElementText('RoadStatus').toLowerCase();
        const roadNumber = getElementText('RoadNumber');
        const roadSegment = getElementText('RoadNumberSegment');
        const segmentDistance = getElementText('RoadNumberSegmentDistance');

        return `${textualRef} ${roadCategory}${roadStatus}${roadNumber} hp${roadSegment} m${segmentDistance}`;
    }
}
