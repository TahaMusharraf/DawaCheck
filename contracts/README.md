# MedicineRegistry — smart contract

The contract is written and deployed with [Remix](https://remix.ethereum.org).
This folder is the source of truth that the API builds against.

| File | What it is |
|---|---|
| `MedicineRegistry.sol` | The contract source |
| `MedicineRegistry.abi.json` | The compiled ABI the API talks to |

## Deployed

| Network | Address |
|---|---|
| Polygon Amoy (chain 80002) | [`0xD95A8B612971667888beB641e79Ad84D481367DA`](https://amoy.polygonscan.com/address/0xD95A8B612971667888beB641e79Ad84D481367DA) |

The wallet that deployed it holds `REGULATOR_ROLE`.

## Working in Remix

1. Open [remix.ethereum.org](https://remix.ethereum.org).
2. In **File explorer**, create `MedicineRegistry.sol` and paste this folder's copy.
   The OpenZeppelin imports resolve automatically from npm.
3. **Solidity compiler** tab: compiler `0.8.24` or newer, EVM version **cancun**,
   then **Compile**.
4. **Deploy & run** tab: Environment = **Injected Provider - MetaMask**, with
   MetaMask on Polygon Amoy. The constructor takes the regulator address.
5. To work with the already-deployed contract instead, paste the address above
   into **At Address**.

## After changing the contract

1. Paste the edited source back into `MedicineRegistry.sol` here.
2. In Remix's compiler tab, copy the **ABI** and save it to
   `MedicineRegistry.abi.json`.
3. Refresh the API's copy:
   ```bash
   cd apps/api && npm run abi:sync
   ```
4. Redeploy from Remix and put the new address in `apps/api/.env`
   (`REGISTRY_ADDRESS`) and in the table above.

## Merkle leaves

Unit hashes must be hashed exactly as the contract's `_leaf` does:
`keccak256(bytes.concat(keccak256(abi.encode(unitHash))))` — the OpenZeppelin
`StandardMerkleTree` format over a single `bytes32` value. The API side of this
lives in `apps/api/src/merkle/merkle.ts`; keep the two in step.
