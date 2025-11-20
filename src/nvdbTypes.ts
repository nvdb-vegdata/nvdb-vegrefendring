export type Egenskap = {
    egenskapstype: string;
    id: number;
    navn: string;
    verdi: string | number;
    enum_id?: number;
};

export type Geometri = {
    srid: number;
    wkt: string;
};

export type Veglenkesekvens = {
    veglenkesekvensid: number;
    relativPosisjon: number;
    kortform: string;
};

export type Strekning = {
    strekning: number;
    delstrekning: number;
    arm: boolean;
    adskilte_løp: string;
    trafikantgruppe: string;
    retning: string;
    meter: number;
}

export type Vegsystem = {
    vegkategori: string;
    fase: string;
    nummer: number;
}

export type Vegsystemreferanse = {
    vegsystem: Vegsystem;
    strekning?: Strekning;
    kortform?: string;
};

export type Posisjon = {
    vegsystemreferanse: Vegsystemreferanse;
    veglenkesekvens: Veglenkesekvens;
    geometri: Geometri;
    kommune: number;
}


export type Stedfesting = {
    type: String;
    veglenkesekvensid: number;
    startposisjon: number;
    sluttposisjon: number;
    retning: String;
};

export type Lokasjon = {
    kommuner: number[];
    fylker: number[];
    geometri: Geometri;
    vegsystemreferanser: Vegsystemreferanse[];
    stedfestinger: Stedfesting[];
};

export type VegobjektMetadata = {
    versjon: number;
    startdato: string;
    sluttdato: string | null;
}

export type Vegobjekt = {
    id: number;
    href: string;
    metadata: VegobjektMetadata;
    egenskaper: Egenskap[];
    lokasjon: Lokasjon;
};

export type Metadata = {
    antallTreffTotalt: number;
    antallTreffPerSide: number;
    side: number;
    antallSider: number;
}
export type HistoricVegobjektResponse = {
    objekter: Vegobjekt[];
    metadata?: Metadata;
};


