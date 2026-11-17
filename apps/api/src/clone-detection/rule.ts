export interface PastScan {
  city: string | null;
  lat: number | null;
  lng: number | null;
  deviceHash: string;
  scannedAt: Date;
}

export interface RuleInput {
  history: PastScan[];
  current: PastScan;
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
  { flag: 'DEVICE_DIVERSITY', check: deviceDiversity },
  { flag: 'EXCESSIVE_SCANS', check: excessiveScans },
  { flag: 'EXPIRED_CIRCULATING', check: expiredCirculating },
];

export function scoreRisk(input: RuleInput): {
  score: number;
  flags: string[];
} {
  const flags: string[] = [];
  let score = 0;

  for (const rule of RULES) {
    const weight = rule.check(input);
    if (weight > 0) {
      score += weight;
      flags.push(rule.flag);
    }
  }

  return { score, flags };
}

function impossibleTravel({ history, current }: RuleInput) {
  const scans = [...history, current]
    .filter((scan) => scan.lat !== null && scan.lng !== null)
    .sort((a, b) => a.scannedAt.getTime() - b.scannedAt.getTime());

  for (let i = 1; i < scans.length; i++) {
    const previous = scans[i - 1];
    const next = scans[i];
    if (
      previous.lat === null ||
      previous.lng === null ||
      next.lat === null ||
      next.lng === null
    ) {
      continue;
    }

    const km = distanceKm(previous.lat, previous.lng, next.lat, next.lng);
    if (km < 50) continue;

    const hours =
      (next.scannedAt.getTime() - previous.scannedAt.getTime()) / 3_600_000;
    if (hours > 0 && km / hours > MAX_SPEED_KMH) return 50;
  }

  return 0;
}

function geographicSpread({ history, current }: RuleInput) {
  const cities = new Set(
    [...history, current]
      .map((s) => s.city?.trim().toLowerCase())
      .filter(Boolean),
  );
  return cities.size > MAX_CITIES ? 40 : 0;
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

function expiredCirculating({ history, current, expiryDate }: RuleInput) {
  return [...history, current].some((scan) => scan.scannedAt > expiryDate)
    ? 10
    : 0;
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
