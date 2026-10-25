export interface ScanContext {
    ip: string;
    deviceId: string;
    lat?: number;
    lng?: number ;
    city?: string;
}

export interface ScanRisk {
    score: number;
    flags: string[];
    warning: boolean
}