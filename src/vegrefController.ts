import type {Vegreferanse} from "./vegreferanse.js";
import {UtilClass} from "./utilClass.js";
import {VegreferanseService} from "./vegrefService.js";
import type {VegrefAndVegsystemreferanse} from "./nvdbTypes.js";

const service = new VegreferanseService();

export class VegrefController {
    async findPosisjoner(vegreferanse: Vegreferanse, tidspunkt?: Date): Promise<VegrefAndVegsystemreferanse[]> {
        const promises = (await service.findVegreferanse(vegreferanse, tidspunkt)).objekter.map(async feature => {
            const veglenkeid = feature.lokasjon.stedfestinger[0]?.veglenkesekvensid || -1;
            const startPos = feature.lokasjon.stedfestinger[0]?.startposisjon || 0;
            const sluttPos = feature.lokasjon.stedfestinger[0]?.sluttposisjon || 0;
            const relativPosisjon = UtilClass.finnRelativPosisjon(feature, vegreferanse.meter)?.position;
            const vegref = UtilClass.toVegreferanse(feature);
            const posisjon = await service.findVegsystemReferanseByLenkeposisjon(veglenkeid, relativPosisjon || 0);
            return {
                vegreferanse: "" + vegref,
                fraDato: "" + feature.metadata.startdato,
                tilDato: "" + feature.metadata.sluttdato,
                veglenkeposisjon: "" + startPos + "-" + sluttPos + "@" + veglenkeid,
                relativPosisjon: "" + (relativPosisjon || 0),
                koordinat: "" + posisjon.geometri.wkt,
                vegsystemreferanse: "" + posisjon.vegsystemreferanse.kortform
            };
        });
        return Promise.all(promises);
    }

    async findPosisjonerByLenkesekvens(linkid: number, position: number): Promise<VegrefAndVegsystemreferanse[]> {
        const promises = (await service.findHistoricVegreferanseByLenkeposisjon(linkid, position)).objekter.map(async feature => {
            const vegref = UtilClass.toVegreferanse(feature);
            var stedfesting = feature.lokasjon.stedfestinger[0];
            const posisjon = await service.findVegsystemReferanseByLenkeposisjon(linkid, position);
            return {
                vegreferanse: "" + vegref,
                fraDato: "" + feature.metadata.startdato,
                tilDato: "" + feature.metadata.sluttdato,
                veglenkeposisjon: "" + stedfesting?.startposisjon + "-" + stedfesting?.sluttposisjon + "@" + stedfesting?.veglenkesekvensid,
                relativPosisjon: "" + position,
                koordinat: "" + posisjon.geometri.wkt,
                vegsystemreferanse: "" + posisjon.vegsystemreferanse.kortform
            }
        });
        return Promise.all(promises);
    }

    async findPosisjonerByCoordinates(northing: number, easting: number, tidspunkt?: Date): Promise<VegrefAndVegsystemreferanse[]> {
        const results: VegrefAndVegsystemreferanse[] = [];
        const posisjoner = await service.findPosisjonByNordOst(northing, easting, tidspunkt);
        for (const posisjon of posisjoner) {
            const veglenkeid = posisjon.veglenkesekvens.veglenkesekvensid;
            const relativPosisjon = posisjon.veglenkesekvens.relativPosisjon;
            const historicVegreferanse = await service.findHistoricVegreferanseByLenkeposisjon(veglenkeid, relativPosisjon, tidspunkt);
            for (const objekt of historicVegreferanse.objekter) {
                const vegref = UtilClass.toVegreferanse(objekt);
                var stedfesting = objekt.lokasjon.stedfestinger[0];
                const posisjonResult = await service.findVegsystemReferanseByLenkeposisjon(veglenkeid, relativPosisjon);
                const myResult = {
                    vegreferanse: "" + vegref,
                    fraDato: "" + objekt.metadata.startdato,
                    tilDato: "" + objekt.metadata.sluttdato,
                    veglenkeposisjon: "" + stedfesting?.startposisjon + "-" + stedfesting?.sluttposisjon + "@" + stedfesting?.veglenkesekvensid,
                    relativPosisjon: "" + relativPosisjon,
                    koordinat: "" + posisjonResult.geometri.wkt,
                    vegsystemreferanse: "" + posisjonResult.vegsystemreferanse.kortform
                };
                results.push(myResult);
            }
        }
        return results;
    }
}