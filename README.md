# DawaCheck — Blockchain-Based Fake Medicine Detection

DawaCheck gives every medicine pack a cryptographic identity registered on a public
blockchain, records every custody handover from factory to pharmacy, and lets
anyone — pharmacist, inspector, or patient — verify a pack in seconds by
scanning its QR code. No app to install, no wallet, no login.

**Final Year Project** · Status: setup phase

---

## The problem

The WHO estimates roughly 1 in 10 medical products in low- and middle-income
countries is substandard or falsified. Holograms get copied, each company's
database is trusted by nobody else, recalls take weeks to reach the counter, and
once a pack leaves the factory its journey is invisible.

## How it works

1. **Register** — A manufacturer creates a batch. The backend generates a secret
   code per pack, hashes them into a Merkle tree, and writes **only the 32-byte
   root** on-chain — one transaction for thousands of packs.
2. **Track** — Each handover (manufacturer → distributor → pharmacy) is recorded
   as an on-chain custody transfer.
3. **Verify** — Scanning a pack's QR checks its Merkle proof against the on-chain
   root with a free read call, then scores the scan history for cloning.
4. **Recall** — The regulator recalls a batch in one transaction; every scan of
   it shows `RECALLED` immediately.

### Verdicts

| Verdict | Meaning |
|---|---|
| `AUTHENTIC` | Genuine code, valid batch, no red flags |
| `NOT_REGISTERED` | Code was never issued — counterfeit |
| `EXPIRED` | Genuine but past expiry |
| `RECALLED` | Genuine but the batch has been recalled |
| `CLONE_SUSPECTED` | Genuine code, but scan behaviour shows it was copied |

A copied QR passes the blockchain check, so DawaCheck also scores each scan against
the unit's history — impossible travel, spread across cities, scans outside the
custody path — to catch cloned labels.

### What goes on-chain

Only trust-critical data: licences, batch Merkle roots, custody transfers, and
recall flags. Names, drug details, scan events and anything personal stay
off-chain in PostgreSQL. No patient data ever touches the chain.

## Actors

| Actor | Can do |
|---|---|
| Regulator (DRAP) | Approve/revoke organisations, issue recalls, view alerts |
| Manufacturer | Register batches, print QR labels, dispatch, recall own batches |
| Distributor | Receive and dispatch custody |
| Pharmacy | Receive custody, mark packs as sold, get recall alerts |
| Patient / Inspector | Scan and verify — no account needed |

Organisations cannot self-register as a manufacturer: they apply, stay
`PENDING`, and are licensed on-chain only after the regulator approves.

## Tech stack

| Layer | Tools |
|---|---|
| Blockchain | Solidity, Hardhat 3, OpenZeppelin, ethers.js v6, Polygon Amoy |
| Backend | NestJS, Prisma, PostgreSQL, Redis + BullMQ |
| Frontend | Next.js, Tailwind CSS, shadcn/ui, html5-qrcode |
| Hosting | Vercel (web), Render (API), Neon (DB), Upstash (Redis), Pinata (IPFS) |

## Repository structure

```
contract/      Hardhat 3 project — MedicineRegistry smart contract and tests
apps/api/      NestJS backend
apps/web/      Next.js frontend
```

## Getting started

Requires Node.js 22+.

```bash
cd contract
npm install
npx hardhat test

cd apps/api
npm install
PORT=4000 npm run start:dev

cd apps/web
npm install
npm run dev
```

## Documentation


