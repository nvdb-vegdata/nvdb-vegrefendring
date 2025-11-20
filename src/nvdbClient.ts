import type {Posisjon, HistoricVegobjektResponse} from "./nvdbTypes.ts";
import type {Vegreferanse} from "./vegreferanse.js";

let baseUrl = "https://nvdbapiles.atlas.vegvesen.no";    // PROD

export function setNvdbBaseUrl(url: string) {
    baseUrl = url;
}

export const fetchHistoricVegreferanse = async (vegreferanse: Vegreferanse, tidspunkt?: Date): Promise<HistoricVegobjektResponse> => {
    const url = baseUrl + "/vegobjekter/532";

    const params = new URLSearchParams({
        segmentering: "true",
        inkludergeometri: "ingen",
        inkluder: "egenskaper,lokasjon,metadata",
        ...(tidspunkt
            ? {tidspunkt: tidspunkt.toISOString().slice(0, 10)}
            : {alle_versjoner: "true"}),
        egenskap:
            `(4566=${vegreferanse.vegkategori})`
            + `AND(4567=${vegreferanse.vegstatus})`
            + `AND(4568=${vegreferanse.vegnummer})`
            + `AND(4569=${vegreferanse.parsell})`
            + `AND(4571<${vegreferanse.meter + 1})`
            + `AND(4572>${vegreferanse.meter - 1})`
            + `AND(4591=${vegreferanse.fylke})`
            + `AND(4592=${vegreferanse.kommune})`
    });

    console.log(`Fetching historic road object (typeid=532) from: ${url}?${params}`);

    const response = await fetch(`${url}?${params.toString()}`, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        console.log("Response not ok:", response.status, response.statusText);
        return {
            objekter: [],
            metadata: {
                antallTreffTotalt: 0,
                antallTreffPerSide: 0,
                side: 0,
                antallSider: 0
            },
        } as HistoricVegobjektResponse;
    }

    return await response.json() as HistoricVegobjektResponse;
};

export const fetchVegsystemReferanse = async (veglenkesekvensid: number, position: number) => {

    const url = baseUrl + "/veg";

    const params = new URLSearchParams({
        veglenkesekvens: `${position}@${veglenkesekvensid}`
    });

    console.log(`Fetching current road position (vegsystemreferanse) from: ${url}?${params}`);

    const response = await fetch(`${url}?${params.toString()}`, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        console.log("Response not ok:", response.status, response.statusText);
        return undefined;
    }
    return await response.json() as Posisjon;
};


export const fetchPosisjonByVegsystemreferanse = async (vegsystemreferanse: String, tidspunkt?: Date) : Promise<Posisjon> => {

    const url = baseUrl + "/veg";

    const params = new URLSearchParams({
        vegsystemreferanse: `${vegsystemreferanse}`,
        ...(tidspunkt ? {tidspunkt: tidspunkt.toISOString().slice(0, 10)} : {})
    });

    console.log(`Fetching current road position (vegsystemreferanse) from: ${url}?${params}`);

    const response = await fetch(`${url}?${params.toString()}`, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        console.log("Response not ok:", response.status, response.statusText);
        return {} as Posisjon;
    }
    return await response.json() as Posisjon;
};


export const fetchPositionByLenkeposisjon = async (veglenksekvensid: number, posisjon: number, tidspunkt?: Date) : Promise<Posisjon> => {

    const url = baseUrl + "/veg";

    const params = new URLSearchParams({
        veglenkesekvens: `${posisjon}@${veglenksekvensid}`,
        ...(tidspunkt ? {tidspunkt: tidspunkt.toISOString().slice(0, 10)} : {})
    });

    console.log(`Fetching current road position (vegsystemreferanse) from: ${url}?${params}`);

    const response = await fetch(`${url}?${params.toString()}`, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        console.log("Response not ok:", response.status, response.statusText);
        return {} as Posisjon;
    }
    return await response.json() as Posisjon;
};

export const fetchPositionByNordOst = async (nord: number, ost: number, tidspunkt?: Date) : Promise<Posisjon[]> => {

    const url = baseUrl + "/posisjon";

    const params = new URLSearchParams({
            nord: `${nord}`,
            ost: `${ost}`,
            ...(tidspunkt ? {tidspunkt: tidspunkt.toISOString().slice(0, 10)} : {})

    });

    console.log(`Fetching  position by nord and ost: ${url}?${params}`);

    const response = await fetch(`${url}?${params.toString()}`, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        console.log("Response not ok:", response.status, response.statusText);
        return {} as Posisjon[];
    }
    return await response.json() as Posisjon[];
};


export const fetchHistoricVegreferanseByPosition = async (veglenksekvensId : number, posisjon: number, tidspunkt?: Date) : Promise<HistoricVegobjektResponse> => {
    const url = baseUrl + "/vegobjekter/532";

    const params = new URLSearchParams({
        segmentering: "true",
        inkluder: "egenskaper,lokasjon,metadata",
        veglenkesekvens: `${posisjon}@${veglenksekvensId}`,
        ...(tidspunkt
            ? {tidspunkt: tidspunkt.toISOString().slice(0, 10)}
            : {alle_versjoner: "true"})
    });

    console.log(`Fetching historic road object (typeid=532) from: ${url}?${params} for veglenkesekvensId=${veglenksekvensId} at posisjon=${posisjon}`);

    const response = await fetch(`${url}?${params.toString()}`, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        console.log("Response not ok:", response.status, response.statusText);
    }
    return await response.json() as HistoricVegobjektResponse;
}
