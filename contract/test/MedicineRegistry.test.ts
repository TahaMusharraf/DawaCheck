import { expect } from "chai";
import { network } from "hardhat";
import {
  buildBatchTree,
  generateCodes,
  toBatchId,
  toUnitHash,
} from "../lib/merkle.js";

const { ethers, networkHelpers } = await network.create();

const DAY = 24 * 60 * 60;
const QUANTITY = 8;

async function deployFixture() {
  const [regulator, manufacturer, otherManufacturer, distributor, pharmacy, stranger] =
    await ethers.getSigners();

  const registry = await ethers.deployContract("MedicineRegistry", [regulator.address]);

  const MANUFACTURER = await registry.MANUFACTURER_ROLE();
  const DISTRIBUTOR = await registry.DISTRIBUTOR_ROLE();
  const PHARMACY = await registry.PHARMACY_ROLE();

  await registry.licenseParty(manufacturer.address, MANUFACTURER, "MFG-001");
  await registry.licenseParty(otherManufacturer.address, MANUFACTURER, "MFG-002");
  await registry.licenseParty(distributor.address, DISTRIBUTOR, "DST-001");
  await registry.licenseParty(pharmacy.address, PHARMACY, "PHM-001");

  return {
    registry,
    regulator,
    manufacturer,
    otherManufacturer,
    distributor,
    pharmacy,
    stranger,
    roles: { MANUFACTURER, DISTRIBUTOR, PHARMACY },
  };
}

async function batchFixture() {
  const base = await deployFixture();
  const batchId = toBatchId("PAN-500-2026-001");
  const codes = generateCodes(QUANTITY);
  const unitHashes = codes.map((code) => toUnitHash(batchId, code));
  const tree = buildBatchTree(unitHashes);

  const now = await networkHelpers.time.latest();
  const manufacturedAt = now - DAY;
  const expiresAt = now + 365 * DAY;

  await base.registry
    .connect(base.manufacturer)
    .registerBatch(batchId, tree.root, QUANTITY, manufacturedAt, expiresAt, "ipfs://meta");

  return { ...base, batchId, unitHashes, tree, expiresAt };
}

describe("MedicineRegistry", function () {
  describe("Deployment", function () {
    it("gives the regulator the regulator and admin roles", async function () {
      const { registry, regulator } = await networkHelpers.loadFixture(deployFixture);
      expect(await registry.hasRole(await registry.REGULATOR_ROLE(), regulator.address)).to.equal(true);
      expect(await registry.hasRole(await registry.DEFAULT_ADMIN_ROLE(), regulator.address)).to.equal(true);
    });

    it("rejects a zero regulator address", async function () {
      const factory = await ethers.getContractFactory("MedicineRegistry");
      await expect(ethers.deployContract("MedicineRegistry", [ethers.ZeroAddress]))
        .to.be.revertedWithCustomError(factory, "ZeroAddress");
    });
  });

  describe("Licensing", function () {
    it("lets the regulator license a party", async function () {
      const { registry, stranger, roles } = await networkHelpers.loadFixture(deployFixture);
      await expect(registry.licenseParty(stranger.address, roles.PHARMACY, "PHM-999"))
        .to.emit(registry, "PartyLicensed")
        .withArgs(stranger.address, roles.PHARMACY, "PHM-999");
      expect(await registry.hasRole(roles.PHARMACY, stranger.address)).to.equal(true);
      expect(await registry.licenseOf(stranger.address)).to.equal("PHM-999");
    });

    it("blocks anyone but the regulator from licensing", async function () {
      const { registry, manufacturer, stranger, roles } = await networkHelpers.loadFixture(deployFixture);
      await expect(
        registry.connect(manufacturer).licenseParty(stranger.address, roles.MANUFACTURER, "X"),
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });

    it("refuses to hand out the regulator role", async function () {
      const { registry, stranger } = await networkHelpers.loadFixture(deployFixture);
      await expect(
        registry.licenseParty(stranger.address, await registry.REGULATOR_ROLE(), "X"),
      ).to.be.revertedWithCustomError(registry, "InvalidRole");
    });

    it("rejects an empty licence number and a zero address", async function () {
      const { registry, stranger, roles } = await networkHelpers.loadFixture(deployFixture);
      await expect(registry.licenseParty(stranger.address, roles.PHARMACY, ""))
        .to.be.revertedWithCustomError(registry, "EmptyLicenseNo");
      await expect(registry.licenseParty(ethers.ZeroAddress, roles.PHARMACY, "X"))
        .to.be.revertedWithCustomError(registry, "ZeroAddress");
    });

    it("stops a revoked manufacturer from registering batches", async function () {
      const { registry, manufacturer, roles } = await networkHelpers.loadFixture(deployFixture);
      await expect(registry.revokeParty(manufacturer.address, roles.MANUFACTURER))
        .to.emit(registry, "PartyRevoked")
        .withArgs(manufacturer.address, roles.MANUFACTURER);

      await expect(
        registry.connect(manufacturer).registerBatch(toBatchId("B"), ethers.id("root"), 1, 1, 2, ""),
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });

    it("blocks anyone but the regulator from revoking", async function () {
      const { registry, manufacturer, distributor, roles } = await networkHelpers.loadFixture(deployFixture);
      await expect(
        registry.connect(manufacturer).revokeParty(distributor.address, roles.DISTRIBUTOR),
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Batch registration", function () {
    it("stores the batch and gives the manufacturer the full quantity", async function () {
      const { registry, manufacturer, batchId, tree, expiresAt } =
        await networkHelpers.loadFixture(batchFixture);

      const batch = await registry.getBatch(batchId);
      expect(batch.manufacturer).to.equal(manufacturer.address);
      expect(batch.merkleRoot).to.equal(tree.root);
      expect(batch.quantity).to.equal(BigInt(QUANTITY));
      expect(batch.expiresAt).to.equal(BigInt(expiresAt));
      expect(await registry.holdingOf(batchId, manufacturer.address)).to.equal(BigInt(QUANTITY));
    });

    it("emits BatchRegistered", async function () {
      const { registry, manufacturer } = await networkHelpers.loadFixture(deployFixture);
      const batchId = toBatchId("B-EVT");
      const root = ethers.id("root");
      await expect(registry.connect(manufacturer).registerBatch(batchId, root, 10, 1, 2, ""))
        .to.emit(registry, "BatchRegistered")
        .withArgs(batchId, manufacturer.address, root, 10, 2);
    });

    it("only lets licensed manufacturers register", async function () {
      const { registry, distributor, stranger } = await networkHelpers.loadFixture(deployFixture);
      for (const caller of [distributor, stranger]) {
        await expect(
          registry.connect(caller).registerBatch(toBatchId("B"), ethers.id("root"), 1, 1, 2, ""),
        ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
      }
    });

    it("rejects registering the same batch twice", async function () {
      const { registry, otherManufacturer, batchId } = await networkHelpers.loadFixture(batchFixture);
      await expect(
        registry.connect(otherManufacturer).registerBatch(batchId, ethers.id("root"), 1, 1, 2, ""),
      )
        .to.be.revertedWithCustomError(registry, "BatchAlreadyExists")
        .withArgs(batchId);
    });

    it("rejects an empty root, zero quantity, and bad dates", async function () {
      const { registry, manufacturer } = await networkHelpers.loadFixture(deployFixture);
      const asMfg = registry.connect(manufacturer);
      const batchId = toBatchId("B-BAD");
      const root = ethers.id("root");

      await expect(asMfg.registerBatch(batchId, ethers.ZeroHash, 1, 1, 2, ""))
        .to.be.revertedWithCustomError(registry, "EmptyMerkleRoot");
      await expect(asMfg.registerBatch(batchId, root, 0, 1, 2, ""))
        .to.be.revertedWithCustomError(registry, "ZeroQuantity");
      await expect(asMfg.registerBatch(batchId, root, 1, 5, 5, ""))
        .to.be.revertedWithCustomError(registry, "InvalidDates")
        .withArgs(5, 5);
    });
  });

  describe("Verification", function () {
    it("accepts a genuine unit with its own proof", async function () {
      const { registry, manufacturer, batchId, unitHashes, tree } =
        await networkHelpers.loadFixture(batchFixture);

      for (let i = 0; i < unitHashes.length; i++) {
        const status = await registry.verifyUnit(batchId, unitHashes[i], tree.getProof(i));
        expect(status.valid).to.equal(true);
        expect(status.recalled).to.equal(false);
        expect(status.expired).to.equal(false);
        expect(status.sold).to.equal(false);
        expect(status.manufacturer).to.equal(manufacturer.address);
      }
    });

    it("rejects a forged code", async function () {
      const { registry, batchId, tree } = await networkHelpers.loadFixture(batchFixture);
      const forged = toUnitHash(batchId, "FAKECODE12345678");
      const status = await registry.verifyUnit(batchId, forged, tree.getProof(0));
      expect(status.valid).to.equal(false);
    });

    it("rejects a genuine code paired with another unit's proof", async function () {
      const { registry, batchId, unitHashes, tree } = await networkHelpers.loadFixture(batchFixture);
      const status = await registry.verifyUnit(batchId, unitHashes[0], tree.getProof(1));
      expect(status.valid).to.equal(false);
    });

    it("returns an empty status for an unknown batch", async function () {
      const { registry, unitHashes, tree } = await networkHelpers.loadFixture(batchFixture);
      const status = await registry.verifyUnit(toBatchId("NOPE"), unitHashes[0], tree.getProof(0));
      expect(status.valid).to.equal(false);
      expect(status.manufacturer).to.equal(ethers.ZeroAddress);
    });

    it("reports expiry once the expiry date passes", async function () {
      const { registry, batchId, unitHashes, tree, expiresAt } =
        await networkHelpers.loadFixture(batchFixture);
      await networkHelpers.time.increaseTo(expiresAt);
      const status = await registry.verifyUnit(batchId, unitHashes[0], tree.getProof(0));
      expect(status.valid).to.equal(true);
      expect(status.expired).to.equal(true);
    });
  });

  describe("Recall", function () {
    it("lets the regulator recall and verifyUnit reports it", async function () {
      const { registry, regulator, batchId, unitHashes, tree } =
        await networkHelpers.loadFixture(batchFixture);
      await expect(registry.recallBatch(batchId, "Contamination"))
        .to.emit(registry, "BatchRecalled")
        .withArgs(batchId, regulator.address, "Contamination");

      const status = await registry.verifyUnit(batchId, unitHashes[0], tree.getProof(0));
      expect(status.recalled).to.equal(true);
    });

    it("lets the batch's own manufacturer recall", async function () {
      const { registry, manufacturer, batchId } = await networkHelpers.loadFixture(batchFixture);
      await expect(registry.connect(manufacturer).recallBatch(batchId, "Labelling error"))
        .to.emit(registry, "BatchRecalled");
    });

    it("blocks other manufacturers and other parties", async function () {
      const { registry, otherManufacturer, distributor, stranger, batchId } =
        await networkHelpers.loadFixture(batchFixture);
      for (const caller of [otherManufacturer, distributor, stranger]) {
        await expect(registry.connect(caller).recallBatch(batchId, "x"))
          .to.be.revertedWithCustomError(registry, "NotAuthorisedToRecall")
          .withArgs(caller.address, batchId);
      }
    });

    it("rejects recalling twice or recalling an unknown batch", async function () {
      const { registry, batchId } = await networkHelpers.loadFixture(batchFixture);
      await registry.recallBatch(batchId, "x");
      await expect(registry.recallBatch(batchId, "x"))
        .to.be.revertedWithCustomError(registry, "AlreadyRecalled");
      await expect(registry.recallBatch(toBatchId("NOPE"), "x"))
        .to.be.revertedWithCustomError(registry, "BatchNotFound");
    });
  });

  describe("Custody", function () {
    it("moves stock manufacturer -> distributor -> pharmacy", async function () {
      const { registry, manufacturer, distributor, pharmacy, batchId } =
        await networkHelpers.loadFixture(batchFixture);

      await expect(registry.connect(manufacturer).transferCustody(batchId, distributor.address, 5))
        .to.emit(registry, "CustodyTransferred")
        .withArgs(batchId, manufacturer.address, distributor.address, 5);
      await registry.connect(distributor).transferCustody(batchId, pharmacy.address, 3);

      expect(await registry.holdingOf(batchId, manufacturer.address)).to.equal(3n);
      expect(await registry.holdingOf(batchId, distributor.address)).to.equal(2n);
      expect(await registry.holdingOf(batchId, pharmacy.address)).to.equal(3n);
    });

    it("rejects shipping more than the sender holds", async function () {
      const { registry, manufacturer, distributor, batchId } =
        await networkHelpers.loadFixture(batchFixture);
      await expect(
        registry.connect(manufacturer).transferCustody(batchId, distributor.address, QUANTITY + 1),
      )
        .to.be.revertedWithCustomError(registry, "InsufficientHolding")
        .withArgs(batchId, manufacturer.address, QUANTITY, QUANTITY + 1);
    });

    it("rejects unlicensed or manufacturer recipients", async function () {
      const { registry, manufacturer, otherManufacturer, stranger, batchId } =
        await networkHelpers.loadFixture(batchFixture);
      for (const to of [stranger, otherManufacturer]) {
        await expect(registry.connect(manufacturer).transferCustody(batchId, to.address, 1))
          .to.be.revertedWithCustomError(registry, "UnauthorisedRecipient")
          .withArgs(to.address);
      }
    });

    it("rejects a zero quantity", async function () {
      const { registry, manufacturer, distributor, batchId } =
        await networkHelpers.loadFixture(batchFixture);
      await expect(registry.connect(manufacturer).transferCustody(batchId, distributor.address, 0))
        .to.be.revertedWithCustomError(registry, "ZeroQuantity");
    });

    it("stops a revoked party from shipping stock it still holds", async function () {
      const { registry, manufacturer, distributor, pharmacy, batchId, roles } =
        await networkHelpers.loadFixture(batchFixture);
      await registry.connect(manufacturer).transferCustody(batchId, distributor.address, 2);
      await registry.revokeParty(distributor.address, roles.DISTRIBUTOR);
      await expect(registry.connect(distributor).transferCustody(batchId, pharmacy.address, 1))
        .to.be.revertedWithCustomError(registry, "NotLicensed")
        .withArgs(distributor.address);
    });

    it("freezes recalled and expired batches", async function () {
      const { registry, manufacturer, distributor, batchId, expiresAt } =
        await networkHelpers.loadFixture(batchFixture);

      const snapshot = await networkHelpers.takeSnapshot();
      await registry.recallBatch(batchId, "x");
      await expect(registry.connect(manufacturer).transferCustody(batchId, distributor.address, 1))
        .to.be.revertedWithCustomError(registry, "BatchIsRecalled");
      await snapshot.restore();

      await networkHelpers.time.increaseTo(expiresAt);
      await expect(registry.connect(manufacturer).transferCustody(batchId, distributor.address, 1))
        .to.be.revertedWithCustomError(registry, "BatchIsExpired");
    });
  });

  describe("Sales", function () {
    async function stockedPharmacyFixture() {
      const base = await batchFixture();
      await base.registry
        .connect(base.manufacturer)
        .transferCustody(base.batchId, base.pharmacy.address, 2);
      return base;
    }

    it("lets a pharmacy holding stock mark a unit sold", async function () {
      const { registry, pharmacy, batchId, unitHashes, tree } =
        await networkHelpers.loadFixture(stockedPharmacyFixture);

      await expect(registry.connect(pharmacy).markSold(batchId, unitHashes[0], tree.getProof(0)))
        .to.emit(registry, "UnitSold")
        .withArgs(batchId, unitHashes[0], pharmacy.address);

      expect(await registry.holdingOf(batchId, pharmacy.address)).to.equal(1n);
      const status = await registry.verifyUnit(batchId, unitHashes[0], tree.getProof(0));
      expect(status.sold).to.equal(true);
    });

    it("rejects selling the same unit twice", async function () {
      const { registry, pharmacy, batchId, unitHashes, tree } =
        await networkHelpers.loadFixture(stockedPharmacyFixture);
      await registry.connect(pharmacy).markSold(batchId, unitHashes[0], tree.getProof(0));
      await expect(registry.connect(pharmacy).markSold(batchId, unitHashes[0], tree.getProof(0)))
        .to.be.revertedWithCustomError(registry, "UnitAlreadySold")
        .withArgs(unitHashes[0]);
    });

    it("rejects a unit that is not in the batch", async function () {
      const { registry, pharmacy, batchId, tree } =
        await networkHelpers.loadFixture(stockedPharmacyFixture);
      const forged = toUnitHash(batchId, "FAKECODE12345678");
      await expect(registry.connect(pharmacy).markSold(batchId, forged, tree.getProof(0)))
        .to.be.revertedWithCustomError(registry, "InvalidUnitProof");
    });

    it("only lets pharmacies sell", async function () {
      const { registry, distributor, batchId, unitHashes, tree } =
        await networkHelpers.loadFixture(stockedPharmacyFixture);
      await expect(registry.connect(distributor).markSold(batchId, unitHashes[0], tree.getProof(0)))
        .to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });

    it("rejects a sale by a pharmacy with no stock of the batch", async function () {
      const { registry, stranger, batchId, unitHashes, tree, roles } =
        await networkHelpers.loadFixture(stockedPharmacyFixture);
      await registry.licenseParty(stranger.address, roles.PHARMACY, "PHM-002");
      await expect(registry.connect(stranger).markSold(batchId, unitHashes[0], tree.getProof(0)))
        .to.be.revertedWithCustomError(registry, "InsufficientHolding")
        .withArgs(batchId, stranger.address, 0, 1);
    });
  });

  describe("Scale", function () {
    it("registers 10,000 units in one transaction and verifies with a 14-hash proof", async function () {
      this.timeout(120_000);
      const { registry, manufacturer } = await networkHelpers.loadFixture(deployFixture);

      const units = 10_000;
      const batchId = toBatchId("SCALE-10K");
      const unitHashes = generateCodes(units).map((code) => toUnitHash(batchId, code));
      const tree = buildBatchTree(unitHashes);

      const now = await networkHelpers.time.latest();
      const tx = await registry
        .connect(manufacturer)
        .registerBatch(batchId, tree.root, units, now, now + 365 * DAY, "ipfs://meta");
      const receipt = await tx.wait();

      const proof = tree.getProof(units - 1);
      const status = await registry.verifyUnit(batchId, unitHashes[units - 1], proof);
      expect(status.valid).to.equal(true);
      expect(proof.length).to.be.at.most(14);

      console.log(`      registerBatch gas for ${units} units: ${receipt!.gasUsed}`);
      console.log(`      proof length: ${proof.length} hashes`);
    });
  });
});
