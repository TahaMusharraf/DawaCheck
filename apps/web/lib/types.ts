export type Verdict =
    | 'AUTHENTIC'
    | 'NOT_REGISTERED'
    | 'EXPIRED'
    | 'RECALLED'
    | 'CLONE_SUSPECTED';

export type JourneyStep = {
    step: string;
    org: string | null;
    city: string | null;
    at: string | null;
};

export type ScanRisk = {
    score: number;
    flags: string[];
    warning: boolean;
};

export type VerifyResponse = {
    message: string;
    data: {
        verdict: Verdict;
        risk?: ScanRisk;
        journey?: JourneyStep[];
        batch: {
            batchId: string;
            drugName: string;
            dosage: string;
            batchNumber: string;
            mfgDate: string;
            expiryDate: string;
            soldAt: string | null;
        } | null;
    manufacturer: { id: string; name: string } | null;
  };
};

// ---- Dashboard ----

export type OrgType = 'REGULATOR' | 'MANUFACTURER' | 'DISTRIBUTOR' | 'PHARMACY';
export type OrgStatus = 'PENDING' | 'LICENSED' | 'REVOKED';
export type AlertStatus = 'OPEN' | 'INVESTIGATING' | 'CONFIRMED' | 'DISMISSED';

/** GET /auth/me */
export type Me = {
    id: string;
    email: string;
    role: 'ADMIN' | 'STAFF';
    org: { id: string; name: string; type: OrgType; status: OrgStatus };
};

export type Organization = {
    id: string;
    name: string;
    type: OrgType;
    status: OrgStatus;
    licenseNo: string;
    city: string;
    walletAddress: string | null;
    licenseTxHash: string | null;
    createdAt: string;
};

export type Partner = Pick<Organization, 'id' | 'name' | 'type' | 'city'>;

/** GET /users/all (regulator only) */
export type AppUser = {
    id: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    organization: Pick<Organization, 'name' | 'type' | 'city' | 'status'>;
};

export type Batch = {
    batchId: string;
    batchNumber: string;
    drugName: string;
    dosage: string;
    quantity: number;
    mfgDate: string;
    expiryDate: string;
    recalled: boolean;
    txHash: string | null;
    createdAt: string;
    manufacturer: { id: string; name: string };
};

export type Holding = {
    batchId: string;
    batchNumber: string;
    drugName: string;
    expiryDate: string;
    held: number;
};

export type CustodyEvent = {
    id: string;
    batchId: string;
    quantity: number;
    txHash: string;
    blockNumber: string;
    occurredAt: string;
    fromOrg: { id: string; name: string; type: OrgType };
    toOrg: { id: string; name: string; type: OrgType };
};

export type Recall = {
    id: string;
    batchId: string;
    reason: string;
    txHash: string;
    issuedAt: string;
    batch: { batchNumber: string; drugName: string; dosage: string };
    issuedBy: { name: string; type: OrgType };
    /** Units this org still holds. Not sent to the regulator. */
    held?: number;
};

export type Alert = {
    id: string;
    unitHash: string;
    batchId: string;
    ruleTriggered: string;
    severity: number;
    status: AlertStatus;
    city: string | null;
    createdAt: string;
    resolvedAt: string | null;
    batch: { batchNumber: string; drugName: string; manufacturer: { name: string } };
};

export type AlertDetail = Alert & {
    unit: {
        scans: {
            scannedAt: string;
            city: string | null;
            lat: number | null;
            lng: number | null;
            result: Verdict;
            riskFlags: string[];
            riskScore: number;
        }[];
    };
};

type Count<K extends string, V> = { [key in K]: V } & { _count: { _all: number } };

/** GET /analytics */
export type Overview = {
    orgs: (Count<'type', OrgType> & { status: OrgStatus })[];
    batches: number;
    recalls: number;
    units: Count<'status', 'ISSUED' | 'SOLD'>[];
    scans: Count<'result', Verdict>[];
    alerts: Count<'status', AlertStatus>[];
};

/** GET /analytics/heatmap */
export type HeatmapRow = {
    city: string;
    _count: { _all: number };
    _avg: { lat: number | null; lng: number | null };
};