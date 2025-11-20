import type {Vegreferanse} from "./vegreferanse.js";
import {UtilClass} from "./utilClass.js";
import {VegreferanseService} from "./vegrefService.js";
import type {VegrefAndVegsystemreferanse} from "./nvdbTypes.js";

const service = new VegreferanseService();

export class VegrefController {
    async findPosisjonerByVegreferanse(vegreferanse: Vegreferanse, tidspunkt?: Date): Promise<VegrefAndVegsystemreferanse[]> {
        const promises = (await service.findVegreferanse(vegreferanse, tidspunkt)).objekter.map(async feature => {
            const veglenkeid = feature.lokasjon.stedfestinger[0]?.veglenkesekvensid || -1;
            const startPos = feature.lokasjon.stedfestinger[0]?.startposisjon || 0;
            const sluttPos = feature.lokasjon.stedfestinger[0]?.sluttposisjon || 0;
            const relativPosisjon = UtilClass.finnRelativPosisjon(feature, vegreferanse.meter)?.position;
            const posisjon = await service.findVegsystemReferanseByLenkeposisjon(veglenkeid, relativPosisjon || 0);
            return {
                vegreferanse: "" + UtilClass.toVegreferanse(feature),
                fraDato: "" + feature.metadata.startdato,
                tilDato: "" + feature.metadata.sluttdato,
                veglenkeposisjon: "" + startPos + "-" + sluttPos + "@" + veglenkeid,
                relativPosisjon: "" + (relativPosisjon || 0),
                beregnetVegreferanse: "" + UtilClass.toVegreferanseWithMeter(feature, UtilClass.finnRelativMeter(feature, relativPosisjon || 0) || 0),
                koordinat: "" + posisjon?.geometri?.wkt,
                vegsystemreferanse: "" + posisjon?.vegsystemreferanse?.kortform
            };
        });
        return Promise.all(promises);
    }

    async findPosisjonerByVegsystemreferanse(vegreferanse: String, tidspunkt?: Date): Promise<VegrefAndVegsystemreferanse[]> {
        var posisjon1 = await service.findPosisjonForVegsystemreferanse(vegreferanse, tidspunkt);

        if (!posisjon1.veglenkesekvens) {
            return []; // Returner en tom liste hvis veglenkesekvens ikke er tilgjengelig
        }
        const veglenkeid = posisjon1.veglenkesekvens.veglenkesekvensid;
        const startPos = posisjon1.veglenkesekvens.relativPosisjon;
        const posisjon = await service.findHistoricVegreferanseByLenkeposisjon(veglenkeid, startPos, tidspunkt);


        const promises = posisjon.objekter.map(feature => {
            const veglenkeid = feature.lokasjon.stedfestinger[0]?.veglenkesekvensid || -1;
            const startPos = feature.lokasjon.stedfestinger[0]?.startposisjon || 0;
            const sluttPos = feature.lokasjon.stedfestinger[0]?.sluttposisjon || 0;
            return {
                vegreferanse: "" + UtilClass.toVegreferanse(feature),
                fraDato: "" + feature.metadata.startdato,
                tilDato: "" + feature.metadata.sluttdato,
                veglenkeposisjon: "" + startPos + "-" + sluttPos + "@" + veglenkeid,
                relativPosisjon: "" + startPos,
                beregnetVegreferanse: "" + UtilClass.toVegreferanseWithMeter(feature, UtilClass.finnRelativMeter(feature, startPos || 0) || 0),
                koordinat: "" + posisjon1.geometri.wkt,
                vegsystemreferanse: "" + posisjon1.vegsystemreferanse.kortform
            };
        });
        return Promise.all(promises);
    }

    async findPosisjonerByLenkesekvens(linkid: number, position: number, tidspunkt?: Date): Promise<VegrefAndVegsystemreferanse[]> {
        const promises = (await service.findHistoricVegreferanseByLenkeposisjon(linkid, position, tidspunkt)).objekter.map(async feature => {
            const vegref = UtilClass.toVegreferanse(feature);
            var stedfesting = feature.lokasjon.stedfestinger[0];
            const posisjon = await service.findVegsystemReferanseByLenkeposisjon(linkid, position, tidspunkt);

            if (!posisjon.veglenkesekvens) {
                throw new Error("Veglenkesekvens ikke funnet for lenkeposisjon");
            }
            return {
                vegreferanse: "" + vegref,
                fraDato: "" + feature.metadata.startdato,
                tilDato: "" + feature.metadata.sluttdato,
                veglenkeposisjon: "" + stedfesting?.startposisjon + "-" + stedfesting?.sluttposisjon + "@" + stedfesting?.veglenkesekvensid,
                relativPosisjon: "" + position,
                beregnetVegreferanse: "" + UtilClass.toVegreferanseWithMeter(feature, UtilClass.finnRelativMeter(feature, position || 0) || 0),
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
                if (!posisjonResult.veglenkesekvens) {
                    throw new Error("Veglenkesekvens ikke funnet for lenkeposisjon");
                }
                const myResult = {
                    vegreferanse: "" + vegref,
                    fraDato: "" + objekt.metadata.startdato,
                    tilDato: "" + objekt.metadata.sluttdato,
                    veglenkeposisjon: "" + stedfesting?.startposisjon + "-" + stedfesting?.sluttposisjon + "@" + stedfesting?.veglenkesekvensid,
                    relativPosisjon: "" + relativPosisjon,
                    beregnetVegreferanse: "" + UtilClass.toVegreferanseWithMeter(objekt, UtilClass.finnRelativMeter(objekt, relativPosisjon || 0) || 0),
                    koordinat: "" + posisjonResult.geometri.wkt,
                    vegsystemreferanse: "" + posisjonResult.vegsystemreferanse.kortform
                };
                results.push(myResult);
            }
        }
        return results;
    }
}