// interfaces.ts
export interface Feature {
    type: string;
    geometry: {
        type: string;
        coordinates: number[];
    };
    properties: {
        veglenkeid: number;
        veglenkeposisjon: number;
        vegref?: string;
        fradato?: string;
        tildato?: string;
    };
    vegsystemreferanse?: {
        kortform?: string;
    };
}

export interface FeatureCollectionWithDate {
    type: string;
    features: Feature[];
    fromdate?: string;
}

export interface FeatureCollectionPoints {
    type: string;
    geometry: {
        type: string;
        coordinates: number[];
    };
    properties: {
        vegref: string;
        fradato: string;
        tildato: string;
        veglenkeid: string;
        veglenkeposisjon: number;
    }
}