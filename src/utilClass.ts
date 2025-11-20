import type {HistoricVegobjekt} from "./nvdbTypes.ts";
import {Vegkategori, Vegstatus} from "./vegreferanse.js";

export class UtilClass {

    /**
     * Converts a `Vegobjekt` to a formatted vegreferanse string.
     * Extracts properties such as vegkategori, vegstatus, vegnummer, parsell, fylke, kommune, and meter values.
     * Returns a string representation combining these values.
     *
     * @param vegobjekt The `Vegobjekt` to convert.
     * @returns A formatted vegreferanse string.
     */
    static toVegreferanse(vegobjekt: HistoricVegobjekt): String {
        const vegkategori = vegobjekt.egenskaper.find(e => e.id === 4566);
        const vegstatus = vegobjekt.egenskaper.find(e => e.id === 4567);
        const vegnummer = vegobjekt.egenskaper.find(e => e.id === 4568);
        const parsell = vegobjekt.egenskaper.find(e => e.id === 4569);
        const fylke = vegobjekt.egenskaper.find(e => e.id === 4591);
        const kommune = vegobjekt.egenskaper.find(e => e.id === 4592);
        const meterStart = vegobjekt.egenskaper.find(e => e.id === 4571);
        const meterEnd = vegobjekt.egenskaper.find(e => e.id === 4572);


        return ""
            + fylke?.verdi?.toString().padStart(2, "0")
            + kommune?.verdi?.toString().padStart(2, "0")
            + (vegkategori?.enum_id === undefined ? "" : Vegkategori[vegkategori.enum_id])
            + (vegstatus?.enum_id === undefined ? "" : Vegstatus[vegstatus.enum_id])
            + vegnummer?.verdi
            + " hp" + parsell?.verdi + " m" + meterStart?.verdi + " - " + meterEnd?.verdi;
    }


    /**
     * Converts a `Vegobjekt` to a formatted vegreferanse string.
     * Extracts properties such as vegkategori, vegstatus, vegnummer, parsell, fylke, kommune, and meter values.
     * Returns a string representation combining these values.
     *
     * @param vegobjekt The `Vegobjekt` to convert.
     * @param meter
     * @returns A formatted vegreferanse string.
     */
    static toVegreferanseWithMeter(vegobjekt: HistoricVegobjekt, meter: number): String {
        const vegkategori = vegobjekt.egenskaper.find(e => e.id === 4566);
        const vegstatus = vegobjekt.egenskaper.find(e => e.id === 4567);
        const vegnummer = vegobjekt.egenskaper.find(e => e.id === 4568);
        const parsell = vegobjekt.egenskaper.find(e => e.id === 4569);
        const fylke = vegobjekt.egenskaper.find(e => e.id === 4591);
        const kommune = vegobjekt.egenskaper.find(e => e.id === 4592);


        return ""
            + fylke?.verdi?.toString().padStart(2, "0")
            + kommune?.verdi?.toString().padStart(2, "0")
            + (vegkategori?.enum_id === undefined ? "" : Vegkategori[vegkategori.enum_id])
            + (vegstatus?.enum_id === undefined ? "" : Vegstatus[vegstatus.enum_id])
            + vegnummer?.verdi
            + " hp" + parsell?.verdi + " m" + meter;
    }


    /**
     * Beregner relativ posisjon for et `Vegobjekt` basert på en gitt meterverdi.
     * Finner start- og sluttmeter-egenskapene (id 4571 og 4572) og bruker første stedfesting.
     * Returnerer `undefined` hvis nødvendig data mangler, ellers returneres relativ posisjon og lokasjon.
     *
     * @param vegobjekt Vegobjektet det skal beregnes posisjon for.
     * @param currentMeter Meterverdien det skal beregnes relativ posisjon for.
     * @returns Et objekt med `position` og `lokasjon`, eller `undefined` hvis data mangler.
     */
    static finnRelativPosisjon(vegobjekt: HistoricVegobjekt, currentMeter: number) {

        const fra = vegobjekt.egenskaper.find(e => e.id === 4571);
        const til = vegobjekt.egenskaper.find(e => e.id === 4572);
        const stedfesting = vegobjekt.lokasjon.stedfestinger[0];

        if (!stedfesting || !fra || !til) {
            return undefined;
        } else {
            const position = UtilClass.calculateCustomRelativePosition(
                typeof fra.verdi === "number" ? fra.verdi : 0,
                typeof til.verdi === "number" ? til.verdi : 0,
                stedfesting.startposisjon,
                stedfesting.sluttposisjon,
                currentMeter);

            return {position, lokasjon: stedfesting};
        }
    }

    static finnRelativMeter(vegobjekt: HistoricVegobjekt, relativePosition: number) {
        const fra = vegobjekt.egenskaper.find(e => e.id === 4571);
        const til = vegobjekt.egenskaper.find(e => e.id === 4572);
        const stedfesting = vegobjekt.lokasjon.stedfestinger[0];

        if (!stedfesting || !fra || !til) {
            return 0;
        } else {
            const startMeter = typeof fra.verdi === "number" ? fra.verdi : 0;
            const endMeter = typeof til.verdi === "number" ? til.verdi : 0;

            // Formel for å konvertere relativ posisjon tilbake til meterverdi
            const meterValue = startMeter + (relativePosition - stedfesting.startposisjon) * (endMeter - startMeter) / (stedfesting.sluttposisjon - stedfesting.startposisjon);

            return Number(meterValue.toFixed(2));
        }
    }


    /**
     * Beregner den nye relative posisjonen basert på meterverdier og egendefinerte relative grenser.
     *
     * @param startMeter Startpunktet for det absolutte meterområdet.
     * @param endMeter Sluttpunktet for det absolutte meterområdet.
     * @param relativeStart Den egendefinerte relative startposisjonen (0-1).
     * @param relativeEnd Den egendefinerte relative sluttposisjonen (0-1).
     * @param currentMeter Den aktuelle meterverdien som skal konverteres.
     * @returns Den nye relative posisjonen innenfor det egendefinerte området.
     */
    static calculateCustomRelativePosition(
        startMeter: number,
        endMeter: number,
        relativeStart: number,
        relativeEnd: number,
        currentMeter: number
    ): number {

        // Sjekk for å unngå deling på null hvis startMeter og endMeter er like
        if (startMeter === endMeter) {
            return relativeStart;
        }

        // Formel for omskalering av currentMeter til det nye relative området
        const customPosition = Math.abs(relativeStart + (currentMeter - startMeter) * (relativeEnd - relativeStart) / (endMeter - startMeter));

        if (customPosition < relativeStart) return relativeStart;
        if (customPosition > relativeEnd) return relativeEnd;

        return customPosition;
    }

    static padNumber(number: number, maxlength: number) {
        return number.toString().padStart(maxlength, '0');
    }


    static formatNumber(num: number, decimals: number = 8) {
        if (num === 0) return "0.0";

        // Round to specified decimals
        let str = num.toFixed(decimals)
            .replace(/0+$/, "")   // remove trailing zeros
            .replace(/\.$/, "");  // remove trailing dot if any

        // If no decimal point remains, add ".0"
        if (!str.includes(".")) str += ".0";

        return str;
    }
}