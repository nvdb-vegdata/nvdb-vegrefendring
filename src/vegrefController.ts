import type {Vegreferanse} from "./vegreferanse.js";
import {UtilClass} from "./utilClass.js";
import {VegreferanseService} from "./vegrefService.js";
import type {VegrefAndVegsystemreferanse} from "./nvdbTypes.js";

const service = new VegreferanseService();

/**
 * Controller for handling operations related to Vegreferanse and Vegsystemreferanse.
 */
export class VegrefController {

    /**
     * Finds positions by a given Vegreferanse and optional timestamp.
     * Returns an array of objects containing vegreferanse, dates, position info, coordinates, and system reference.
     * @param vegreferanse - The Vegreferanse object to search for.
     * @param tidspunkt - Optional timestamp for historic lookup.
     * @returns Promise resolving to an array of position and reference objects.
     */
    async findPosisjonerByVegreferanse(vegreferanse: Vegreferanse, tidspunkt?: Date) {

        const promises = (await service.findVegreferanse(vegreferanse, tidspunkt)).objekter.map(async objekt => {
            const lenkeid = objekt.lokasjon.stedfestinger[0]?.veglenkesekvensid || -1;
            const pos = UtilClass.finnRelativPosisjon(objekt, vegreferanse.meter, false)?.position || 0;
            const historicVegobjektResponse = await service.findHistoricVegreferanseByLenkeposisjon(lenkeid, pos, tidspunkt);
            return await Promise.all(historicVegobjektResponse.objekter.map(async feature => {
                const stedfesting = feature.lokasjon.stedfestinger[0];
                const veglenkeid = stedfesting?.veglenkesekvensid || -1;
                const startPos = stedfesting?.startposisjon || 0;
                const sluttPos = stedfesting?.sluttposisjon || 0;
                const vegsystemreferanse = await service.findVegsystemReferanseByLenkeposisjon(veglenkeid, pos);
                return {
                    vegreferanse: "" + UtilClass.toVegreferanse(feature),
                    fraDato: "" + feature.metadata.startdato,
                    tilDato: "" + feature.metadata.sluttdato,
                    veglenkeposisjon: "" + startPos + "-" + sluttPos + "@" + veglenkeid,
                    veglenkeid : veglenkeid,
                    relativPosisjon: pos,
                    beregnetVegreferanse: "" + UtilClass.toVegreferanseWithMeter(feature, UtilClass.finnRelativMeter(feature, pos || 0) || 0),
                    koordinat: "" + vegsystemreferanse?.geometri?.wkt,
                    vegsystemreferanse: "" + vegsystemreferanse?.vegsystemreferanse?.kortform
                };
            }));
        });
        return (await Promise.all(promises)).flat();
    }

    /**
     * Finds positions by a given road system reference (`vegreferanse`) and optional timestamp.
     * Returns an array of objects containing road reference, dates, position info, coordinates, and system reference.
     * @param vegreferanse - The road system reference to search for.
     * @param tidspunkt - Optional date for historical lookup.
     * @returns Promise resolving to an array of position and reference objects.
     */
    async findPosisjonerByVegsystemreferanse(vegreferanse: String, tidspunkt?: Date): Promise<VegrefAndVegsystemreferanse[]> {
        var posisjon = await service.findPosisjonForVegsystemreferanse(vegreferanse, tidspunkt);

        if (!posisjon.veglenkesekvens) {
            return []; // Return empty list if no link sequence found
        }
        const veglenkeid = posisjon.veglenkesekvens.veglenkesekvensid;
        const relativPosisjon = posisjon.veglenkesekvens.relativPosisjon;
        const posisjonVegref = await service.findHistoricVegreferanseByLenkeposisjon(veglenkeid, relativPosisjon, tidspunkt);


        const promises = posisjonVegref.objekter.map(feature => {
            var stedfesting = feature.lokasjon.stedfestinger[0];
            const veglenkeid = stedfesting?.veglenkesekvensid || -1;
            const startPos = stedfesting?.startposisjon || 0;
            const sluttPos = stedfesting?.sluttposisjon || 0;
            return {
                vegreferanse: "" + UtilClass.toVegreferanse(feature),
                fraDato: "" + feature.metadata.startdato,
                tilDato: "" + feature.metadata.sluttdato,
                veglenkeposisjon: "" + startPos + "-" + sluttPos + "@" + veglenkeid,
                veglenkeid: veglenkeid,
                relativPosisjon: startPos,
                beregnetVegreferanse: "" + UtilClass.toVegreferanseWithMeter(feature, UtilClass.finnRelativMeter(feature, relativPosisjon || 0) || 0),
                koordinat: "" + posisjon.geometri.wkt,
                vegsystemreferanse: "" + posisjon.vegsystemreferanse.kortform
            };
        });
        return Promise.all(promises);
    }

    /**
     * Finds positions by a given link sequence ID (`linkid`) and position, with optional timestamp.
     * Returns an array of objects containing road reference, dates, position info, coordinates, and system reference.
     * @param linkid - The link sequence ID to search for.
     * @param position - The position along the link sequence.
     * @param tidspunkt - Optional timestamp for historical lookup.
     * @returns Promise resolving to an array of position and reference objects.
     */
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
                veglenkeid: linkid,
                relativPosisjon: position,
                beregnetVegreferanse: "" + UtilClass.toVegreferanseWithMeter(feature, UtilClass.finnRelativMeter(feature, position || 0) || 0),
                koordinat: "" + posisjon.geometri.wkt,
                vegsystemreferanse: "" + posisjon.vegsystemreferanse.kortform
            }
        });
        return Promise.all(promises);
    }

    /**
     * Finds positions by given coordinates (northing and easting) and optional timestamp.
     * Returns an array of objects containing road reference, dates, position info, coordinates, and system reference.
     * @param northing - The northing coordinate.
     * @param easting - The easting coordinate.
     * @param tidspunkt - Optional timestamp for historical lookup.
     * @returns Promise resolving to an array of position and reference objects.
     */
    async findPosisjonerByCoordinates(northing: number, easting: number, tidspunkt?: Date): Promise<VegrefAndVegsystemreferanse[]> {
        const results: VegrefAndVegsystemreferanse[] = [];
        const posisjoner = await service.findPosisjonByNordOst(northing, easting, tidspunkt);
        for (const posisjon of posisjoner) {
            const veglenkeid = posisjon.veglenkesekvens.veglenkesekvensid;
            const relativPosisjon = posisjon.veglenkesekvens.relativPosisjon;
            const historicVegreferanse = await service.findHistoricVegreferanseByLenkeposisjon(veglenkeid, relativPosisjon, tidspunkt);
            for (const objekt of historicVegreferanse.objekter) {
                const vegref = UtilClass.toVegreferanse(objekt);
                const stedfesting = objekt.lokasjon.stedfestinger[0];
                const posisjonResult = await service.findVegsystemReferanseByLenkeposisjon(veglenkeid, relativPosisjon);
                if (!posisjonResult.veglenkesekvens) {
                    throw new Error("Veglenkesekvens ikke funnet for lenkeposisjon");
                }
                const myResult = {
                    vegreferanse: "" + vegref,
                    fraDato: "" + objekt.metadata.startdato,
                    tilDato: "" + objekt.metadata.sluttdato,
                    veglenkeposisjon: "" + stedfesting?.startposisjon + "-" + stedfesting?.sluttposisjon + "@" + stedfesting?.veglenkesekvensid,
                    veglenkeid: veglenkeid,
                    relativPosisjon: relativPosisjon,
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