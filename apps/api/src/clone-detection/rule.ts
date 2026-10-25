export interface PastScan {
  city: string | null;
  lat: number | null;
  lng: number | null;
  deviceHash: string;
  scannedAt: Date;
}

export interface RuleInput {
  history: PastScan[];          // this unit's earlier scans
  current: PastScan;            // the scan being made now
  custodyCities: Set<string>;   // every org the batch moved to
  soldAt: Date | null;
  expiryDate: Date;
}

export const CLONE_THRESHOLD = 70;
export const WARNING_THRESHOLD = 40;

const MAX_SPEED_KMH = 900;
const MAX_CITIES = 3;
const MAX_DEVICES = 20;
const MAX_SCANS_AFTER_SALE = 8;

/** Each rule returns its weight when it fires, 0 otherwise. */
export const RULES: { flag: string; check: (i: RuleInput) => number }[] = [
  { flag: 'IMPOSSIBLE_TRAVEL', check: impossibleTravel },
  { flag: 'GEOGRAPHIC_SPREAD', check: geographicSpread },
  { flag: 'OUT_OF_CUSTODY', check: outOfCustody },
  { flag: 'DEVICE_DIVERSITY', check: deviceDiversity },
  { flag: 'EXCESSIVE_SCANS', check: excessiveScans },
  { flag: 'EXPIRED_CIRCULATING', check: expiredCirculating },
];

function impossibleTravel({ history, current }: RuleInput) {
  const prev = [...history].reverse().find((s) => s.lat !== null && s.lng !== null);
  if (!prev || current.lat === null || current.lng === null) return 0;

  const km = distanceKm(prev.lat!, prev.lng!, current.lat, current.lng);
  // Two scans seconds apart can still differ by GPS noise, so ignore short hops.
  if (km < 50) return 0;
  const hours = (current.scannedAt.getTime() - prev.scannedAt.getTime()) / 3_600_000;
  return hours <= 0 || km / hours > MAX_SPEED_KMH ? 50 : 0;
}

function geographicSpread({ history, current }: RuleInput) {
  const cities = new Set(
    [...history, current].map((s) => s.city?.trim().toLowerCase()).filter(Boolean),
  );
  return cities.size > MAX_CITIES ? 40 : 0;
}

function outOfCustody({ current, custodyCities }: RuleInput) {
  const city = current.city?.trim().toLowerCase();
  return city && !custodyCities.has(city) ? 40 : 0;
}

function deviceDiversity({ history, current }: RuleInput) {
  const devices = new Set([...history, current].map((s) => s.deviceHash));
  return devices.size >= MAX_DEVICES ? 30 : 0;
}

function excessiveScans({ history, current, soldAt }: RuleInput) {
  if (!soldAt) return 0;
  const afterSale = [...history, current].filter((s) => s.scannedAt > soldAt);
  return afterSale.length >= MAX_SCANS_AFTER_SALE ? 20 : 0;
}

function expiredCirculating({ current, expiryDate }: RuleInput) {
  return current.scannedAt > expiryDate ? 10 : 0;
}

/** Great-circle distance (haversine). */
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}
