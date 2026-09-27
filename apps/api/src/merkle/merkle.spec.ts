import { keccak256 } from 'ethers';
import {
  buildBatchTree,
  generateCodes,
  toBatchId,
  toUnitHash,
} from './merkle';

describe('merkle helpers', () => {
  it('derives a stable batchId from the batch number', () => {
    expect(toBatchId('PAN-500-2026-001')).toBe(toBatchId('PAN-500-2026-001'));
    expect(toBatchId('PAN-500-2026-001')).not.toBe(toBatchId('PAN-500-2026-002'));
    expect(toBatchId('PAN-500-2026-001')).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it('binds a unit hash to its batch, so a code cannot be reused elsewhere', () => {
    const batchA = toBatchId('BATCH-A');
    const batchB = toBatchId('BATCH-B');
    expect(toUnitHash(batchA, 'A7X9')).not.toBe(toUnitHash(batchB, 'A7X9'));
  });

  it('generates distinct codes', () => {
    const codes = generateCodes(500);
    expect(new Set(codes).size).toBe(500);
    expect(codes[0]).toMatch(/^[0-9A-F]{16}$/);
  });

  it('proves a unit belongs to the batch and rejects a forged one', () => {
    const batchId = toBatchId('PAN-500-2026-001');
    const hashes = generateCodes(64).map((code) => toUnitHash(batchId, code));
    const tree = buildBatchTree(hashes);

    // The proof verifies against the root the contract stores.
    expect(tree.verify([hashes[7]], tree.getProof(7))).toBe(true);
    // Another unit's proof does not.
    expect(tree.verify([hashes[7]], tree.getProof(8))).toBe(false);
    // A code that was never issued has no place in the tree.
    const forged = toUnitHash(batchId, 'FAKECODE12345678');
    expect(tree.verify([forged], tree.getProof(0))).toBe(false);
  });

  it('keeps proofs short: 1000 units need about 10 hashes', () => {
    const batchId = toBatchId('SCALE');
    const hashes = generateCodes(1000).map((code) => toUnitHash(batchId, code));
    const tree = buildBatchTree(hashes);
    expect(tree.getProof(999).length).toBeLessThanOrEqual(10);
  });

  it('hashes leaves the way the contract does', () => {
    const batchId = toBatchId('LEAF');
    const unitHash = toUnitHash(batchId, 'CODE0001');
    const tree = buildBatchTree([unitHash]);

    // Contract: keccak256(bytes.concat(keccak256(abi.encode(unitHash)))).
    // abi.encode of a single bytes32 is the value itself, and a one-leaf tree's
    // root is that leaf, so both sides must come out identical.
    expect(tree.root).toBe(keccak256(keccak256(unitHash)));
  });
});
