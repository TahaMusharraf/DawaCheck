import { PastScan, scoreRisk } from './rule';

function scan(
  city: string,
  lat: number,
  lng: number,
  scannedAt: string,
  deviceHash = 'device-1',
): PastScan {
  return {
    city,
    lat,
    lng,
    scannedAt: new Date(scannedAt),
    deviceHash,
  };
}

describe('scoreRisk', () => {
  it('keeps an earlier impossible-travel signal on later scans at the same city', () => {
    const lahore = scan('Lahore', 31.5204, 74.3587, '2026-01-01T10:00:00Z');
    const pindi = scan('Rawalpindi', 33.5651, 73.0169, '2026-01-01T10:10:00Z');

    const secondScanScore = scoreRisk({
      history: [lahore],
      current: pindi,
      soldAt: null,
      expiryDate: new Date('2027-01-01T00:00:00Z'),
    });

    const thirdScanScore = scoreRisk({
      history: [lahore, pindi],
      current: scan(
        'Rawalpindi',
        33.5651,
        73.0169,
        '2026-01-01T10:30:00Z',
        'device-2',
      ),
      soldAt: null,
      expiryDate: new Date('2027-01-01T00:00:00Z'),
    });

    expect(secondScanScore).toEqual({
      score: 50,
      flags: ['IMPOSSIBLE_TRAVEL'],
    });
    expect(thirdScanScore).toEqual(secondScanScore);
  });

  it('does not classify a same-time distant scan as impossible travel', () => {
    const result = scoreRisk({
      history: [scan('Lahore', 31.5204, 74.3587, '2026-01-01T10:00:00Z')],
      current: scan('Rawalpindi', 33.5651, 73.0169, '2026-01-01T10:00:00Z'),
      soldAt: null,
      expiryDate: new Date('2027-01-01T00:00:00Z'),
    });

    expect(result.flags).not.toContain('IMPOSSIBLE_TRAVEL');
  });

  it('keeps expired-circulation evidence from any scan in the history', () => {
    const result = scoreRisk({
      history: [scan('Lahore', 31.5204, 74.3587, '2026-01-02T10:00:00Z')],
      current: scan('Lahore', 31.5204, 74.3587, '2026-01-03T10:00:00Z'),
      soldAt: null,
      expiryDate: new Date('2026-01-01T00:00:00Z'),
    });

    expect(result).toEqual({
      score: 10,
      flags: ['EXPIRED_CIRCULATING'],
    });
  });

  it('does not score scan city as out of custody without per-unit custody data', () => {
    const result = scoreRisk({
      history: [],
      current: scan('Pindi', 33.5651, 73.0169, '2026-01-01T10:00:00Z'),
      soldAt: null,
      expiryDate: new Date('2027-01-01T00:00:00Z'),
    });

    expect(result).toEqual({ score: 0, flags: [] });
  });
});
