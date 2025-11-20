import type {Posisjon, HistoricVegobjektResponse, VegrefAndVegsystemreferanse, Stedfesting} from './nvdbTypes.ts';
import type {Vegreferanse} from "./vegreferanse.js";
import {
    fetchHistoricVegreferanse,
    fetchHistoricVegreferanseByPosition,
    fetchPosisjonByVegsystemreferanse, fetchPositionByLenkeposisjon, fetchPositionByNordOst, setNvdbBaseUrl
} from "./nvdbClient.js";
import {UtilClass} from "./utilClass.js";


export class VegreferanseService {

    /**
     * Service class for handling operations related to Vegreferanse.
     */
    async findVegreferanse(vegreferanse: Vegreferanse, tidspunkt?: Date): Promise<HistoricVegobjektResponse> {
        return fetchHistoricVegreferanse(vegreferanse, tidspunkt);
    }

    async findPosisjonForVegsystemreferanse(vegsystemreferanse: String, tidspunkt?: Date): Promise<Posisjon> {
        return fetchPosisjonByVegsystemreferanse(vegsystemreferanse)
    }

    async findHistoricVegreferanseByLenkeposisjon(veglenkeskvensid: number, posisjon: number, tidspunkt?: Date): Promise<HistoricVegobjektResponse> {
        return fetchHistoricVegreferanseByPosition(veglenkeskvensid, posisjon, tidspunkt);
    }

    findVegsystemReferanseByLenkeposisjon(veglenkesekvensid: number, position: number): Promise<Posisjon> {
        return fetchPositionByLenkeposisjon(veglenkesekvensid, position);
    }

    async findPosisjonByNordOst(nord: number, ost: number, tidspunkt?: Date): Promise<Posisjon[]> {
        return fetchPositionByNordOst(nord, ost, tidspunkt);
    }

    async setBaseUrl(baseUrl: string) {
        setNvdbBaseUrl(baseUrl);
    }
}

