import type {Feature, FeatureCollectionPoints} from "./interfaces.ts";


export class HentVegref {

    baseUrl = 'https://visveginfo-static.opentns.org';
    baseUrlV4 = 'https://nvdbapiles.atlas.vegvesen.no';

    constructor() {

    }

    async fetchXML(url: string) {
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

    async fetchJSON(url: string) {
        try {
            const response = await fetch(url, {
                mode: 'cors',
                headers: {
                    'Accept': 'application/json',
                    'X-Client': 'vegkart'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const json = await response.json();
            return this.toRoadlinkCollection(json);

        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }



    async veglenkesekvens(linkid: number, position: number)  {
        const url = `${this.baseUrl}/RoadInfoService3d/GetRoadReferenceHistoryForNVDBReference?reflinkOID=${linkid}&relLen=${position}`;

        try {
            const xmlDoc = await this.fetchXML(url);
            return { type: 'FeatureCollection', features: [] };
        } catch (error) {
            console.error('Error in veglenkesekvens:', error);
            return { type: 'FeatureCollection', features: [] };
        }
    }


    toRoadlinkCollection(jsonDoc: Record<string, any>) {
        const features = [];

        for (const [key, value] of Object.entries(jsonDoc)) {
            features.push({
                type: 'Roadlink',
                properties: {
                    vegsystemreferanse: value.vegsystemreferanse,
                    veglenkesekvens: value.veglenkesekvens,
                    geometri: value.geometri,
                    kommune: value.kommune,
                }
            })
        }

        return {
            type: 'RoadlinksCollection  ',
            features: features,
        };
    }


    async veglenkesekvensLesV4(params: { linkIds: string[] })  {
        const { linkIds } = params;
        const url = `${this.baseUrlV4}/vegnett/api/v4/veg/batch?veglenkesekvenser=${linkIds.join(',')}`;

        console.log(url);
        try {
            let json = await this.fetchJSON(url);
            return json;
        } catch (error) {
            console.error('Error in veglenkesekvens:', error);
            return { type: 'FeatureCollection', features: [] };
        }
    }


    xmlElementToGeoJSON(element: Element, dagensverdi: boolean) : FeatureCollectionPoints | undefined {
        try {
            const getElementText = (tagName: string) => {
                const el = element.getElementsByTagName(tagName)[0];
                return el ? el.textContent : '';
            };

            const vegref = this.createVegrefString(element);
            const fradato = getElementText('ValidFrom').substring(0, 10);
            const tildato = getElementText('ValidTo').substring(0, 10);
            const veglenkeid = getElementText('ReflinkOID');
            const veglenkeposisjon = Math.round(parseFloat(getElementText('Measure')) * 100000000) / 100000000;

            const positionEl = element.getElementsByTagName('RoadNetPosition')[0];
            if (positionEl == undefined) return undefined;

            var elementsByTagName = positionEl.getElementsByTagName('X');
            const x = elementsByTagName[0] ? parseFloat(elementsByTagName[0].textContent) : 0;
            var elementsByTagName1 = positionEl.getElementsByTagName('Y');
            const y = elementsByTagName1[0] ? parseFloat(elementsByTagName1[0].textContent) : 0;
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
            return undefined;
        }
    }

    createVegrefString(element: Element) {
        const getElementText = (tagName: any) => {
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
