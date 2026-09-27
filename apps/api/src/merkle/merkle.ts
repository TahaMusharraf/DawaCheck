import { randomBytes } from "node:crypto";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { AbiCoder, id, keccak256 } from "ethers";

// Must match MedicineRegistry._leaf: StandardMerkleTree over a single bytes32 value.
// Moves to packages/shared once the API needs it.

const coder = AbiCoder.defaultAbiCoder();

/** batchId = keccak256 of the human-readable batch number. */
export function toBatchId(batchNumber: string): string {
  return id(batchNumber);
}

/** unitHash = keccak256(abi.encode(batchId, code)). The raw code never leaves the QR label. */
export function toUnitHash(batchId: string, code: string): string {
  return keccak256(coder.encode(["bytes32", "string"], [batchId, code]));
}

/** Random secret codes to print on the packs, 16 hex chars each. */
export function generateCodes(count: number): string[] {
  return Array.from({ length: count }, () => randomBytes(8).toString("hex").toUpperCase());
}

export function buildBatchTree(unitHashes: string[]) {
  return StandardMerkleTree.of(
    unitHashes.map((hash) => [hash]),
    ["bytes32"],
  );
}
