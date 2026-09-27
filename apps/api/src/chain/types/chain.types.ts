/** Plain shapes returned by ChainService. ethers gives back BigInt-heavy structs;
 *  these are JSON-safe and match how the rest of the API talks about batches. */

export interface BatchOnChain {
  manufacturer: string;
  merkleRoot: string;
  quantity: number;
  manufacturedAt: string;
  expiresAt: string;
  recalled: boolean;
  metadataCID: string;
}

export interface UnitStatusOnChain {
  valid: boolean;
  recalled: boolean;
  expired: boolean;
  sold: boolean;
  manufacturer: string;
  manufacturedAt: string;
  expiresAt: string;
  metadataCID: string;
}

/** Raw tuple shapes as ethers decodes them (named fields on a Result object). */
export interface RawBatch {
  manufacturer: string;
  merkleRoot: string;
  quantity: bigint;
  manufacturedAt: bigint;
  expiresAt: bigint;
  recalled: boolean;
  metadataCID: string;
}

export interface RawUnitStatus {
  valid: boolean;
  recalled: boolean;
  expired: boolean;
  sold: boolean;
  manufacturer: string;
  manufacturedAt: bigint;
  expiresAt: bigint;
  metadataCID: string;
}

/** Unix seconds (as the contract stores them) -> ISO string, or null for "unset". */
export function toIso(seconds: bigint): string {
  return new Date(Number(seconds) * 1000).toISOString();
}

export function toBatchOnChain(raw: RawBatch): BatchOnChain {
  return {
    manufacturer: raw.manufacturer,
    merkleRoot: raw.merkleRoot,
    quantity: Number(raw.quantity),
    manufacturedAt: toIso(raw.manufacturedAt),
    expiresAt: toIso(raw.expiresAt),
    recalled: raw.recalled,
    metadataCID: raw.metadataCID,
  };
}

export function toUnitStatusOnChain(raw: RawUnitStatus): UnitStatusOnChain {
  return {
    valid: raw.valid,
    recalled: raw.recalled,
    expired: raw.expired,
    sold: raw.sold,
    manufacturer: raw.manufacturer,
    manufacturedAt: toIso(raw.manufacturedAt),
    expiresAt: toIso(raw.expiresAt),
    metadataCID: raw.metadataCID,
  };
}

/** A batch that was never registered comes back as the zero address. */
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export function isRegistered(manufacturer: string): boolean {
  return manufacturer !== ZERO_ADDRESS;
}
