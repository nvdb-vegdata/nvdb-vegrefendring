import type {HistoricVegobjektResponse, Posisjon} from './nvdbTypes.ts';
import type {Vegreferanse} from "./vegreferanse.js";
import {
    fetchHistoricVegreferanse,
    fetchHistoricVegreferanseByPosition,
    fetchPosisjonByVegsystemreferanse,
    fetchPositionByLenkeposisjon,
    fetchPositionByNordOst,
    setNvdbBaseUrl
} from "./nvdbClient.js";


export class VegreferanseService {

    /**
     * Service class for handling operations related to Vegreferanse.
     */
    async findVegreferanse(vegreferanse: Vegreferanse, tidspunkt?: Date): Promise<HistoricVegobjektResponse> {
        return fetchHistoricVegreferanse(vegreferanse, tidspunkt);
    }

    async findPosisjonForVegsystemreferanse(vegsystemreferanse: String, tidspunkt?: Date): Promise<Posisjon> {
        return fetchPosisjonByVegsystemreferanse(vegsystemreferanse, tidspunkt)
    }

    async findHistoricVegreferanseByLenkeposisjon(veglenkeskvensid: number, posisjon: number, tidspunkt?: Date): Promise<HistoricVegobjektResponse> {
        return fetchHistoricVegreferanseByPosition(veglenkeskvensid, posisjon, tidspunkt);
    }

    async findVegsystemReferanseByLenkeposisjon(veglenkesekvensid: number, position: number, tidspunkt?: Date): Promise<Posisjon> {
        return fetchPositionByLenkeposisjon(veglenkesekvensid, position, tidspunkt);
    }

    async findPosisjonByNordOst(nord: number, ost: number, tidspunkt?: Date): Promise<Posisjon[]> {
        return fetchPositionByNordOst(nord, ost, tidspunkt);
    }

    async setBaseUrl(baseUrl: string) {
        setNvdbBaseUrl(baseUrl);
    }
}

