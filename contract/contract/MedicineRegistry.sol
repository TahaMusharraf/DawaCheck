// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title MedicineRegistry
/// @notice On-chain registry of licensed parties and medicine batches. Each batch
///         is committed as a single Merkle root over its unit hashes; any unit
///         can then be verified with a Merkle proof in a free view call.
/// @dev Leaves follow the OpenZeppelin StandardMerkleTree format with a single
///      `bytes32` value: leaf = keccak256(bytes.concat(keccak256(abi.encode(unitHash)))).
///      Custody is tracked per batch as quantities held by each party, so one
///      shipment is one transaction; sales are recorded per unit.
contract MedicineRegistry is AccessControl {
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");

    struct Batch {
        address manufacturer;
        bytes32 merkleRoot;
        uint32 quantity;
        uint64 manufacturedAt;
        uint64 expiresAt;
        bool recalled;
        string metadataCID;
    }

    /// @notice Result of verifying a single unit. Returned by `verifyUnit`.
    struct UnitStatus {
        bool valid;
        bool recalled;
        bool expired;
        bool sold;
        address manufacturer;
        uint64 manufacturedAt;
        uint64 expiresAt;
        string metadataCID;
    }

    mapping(bytes32 batchId => Batch) private _batches;
    mapping(address party => string licenseNo) public licenseOf;
    mapping(bytes32 batchId => mapping(address holder => uint32 quantity)) public holdingOf;
    mapping(bytes32 unitHash => bool) public isSold;

    event PartyLicensed(address indexed party, bytes32 indexed role, string licenseNo);
    event PartyRevoked(address indexed party, bytes32 indexed role);
    event BatchRegistered(
        bytes32 indexed batchId,
        address indexed manufacturer,
        bytes32 merkleRoot,
        uint32 quantity,
        uint64 expiresAt
    );
    event BatchRecalled(bytes32 indexed batchId, address indexed issuedBy, string reason);
    event CustodyTransferred(
        bytes32 indexed batchId,
        address indexed from,
        address indexed to,
        uint32 quantity
    );
    event UnitSold(bytes32 indexed batchId, bytes32 indexed unitHash, address indexed pharmacy);

    error InvalidRole(bytes32 role);
    error ZeroAddress();
    error EmptyLicenseNo();
    error BatchAlreadyExists(bytes32 batchId);
    error BatchNotFound(bytes32 batchId);
    error EmptyMerkleRoot();
    error ZeroQuantity();
    error InvalidDates(uint64 manufacturedAt, uint64 expiresAt);
    error AlreadyRecalled(bytes32 batchId);
    error NotAuthorisedToRecall(address caller, bytes32 batchId);
    error BatchIsRecalled(bytes32 batchId);
    error BatchIsExpired(bytes32 batchId);
    error NotLicensed(address party);
    error UnauthorisedRecipient(address recipient);
    error InsufficientHolding(bytes32 batchId, address holder, uint32 held, uint32 requested);
    error InvalidUnitProof(bytes32 batchId, bytes32 unitHash);
    error UnitAlreadySold(bytes32 unitHash);

    constructor(address regulator) {
        if (regulator == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, regulator);
        _grantRole(REGULATOR_ROLE, regulator);
    }

    // ─── Licensing ──────────────────────────────────────────────────────────

    /// @notice Grant a supply-chain role to a party after off-chain approval.
    function licenseParty(address party, bytes32 role, string calldata licenseNo)
        external
        onlyRole(REGULATOR_ROLE)
    {
        _requireSupplyChainRole(role);
        if (party == address(0)) revert ZeroAddress();
        if (bytes(licenseNo).length == 0) revert EmptyLicenseNo();

        _grantRole(role, party);
        licenseOf[party] = licenseNo;
        emit PartyLicensed(party, role, licenseNo);
    }

    /// @notice Revoke a party's supply-chain role. Batches it already registered stay on record.
    function revokeParty(address party, bytes32 role) external onlyRole(REGULATOR_ROLE) {
        _requireSupplyChainRole(role);
        _revokeRole(role, party);
        emit PartyRevoked(party, role);
    }

    // ─── Batches ────────────────────────────────────────────────────────────

    /// @notice Commit a whole batch on-chain as one Merkle root.
    /// @param batchId keccak256 of the human-readable batch number.
    function registerBatch(
        bytes32 batchId,
        bytes32 merkleRoot,
        uint32 quantity,
        uint64 manufacturedAt,
        uint64 expiresAt,
        string calldata metadataCID
    ) external onlyRole(MANUFACTURER_ROLE) {
        if (_batches[batchId].manufacturer != address(0)) revert BatchAlreadyExists(batchId);
        if (merkleRoot == bytes32(0)) revert EmptyMerkleRoot();
        if (quantity == 0) revert ZeroQuantity();
        if (expiresAt <= manufacturedAt) revert InvalidDates(manufacturedAt, expiresAt);

        _batches[batchId] = Batch({
            manufacturer: msg.sender,
            merkleRoot: merkleRoot,
            quantity: quantity,
            manufacturedAt: manufacturedAt,
            expiresAt: expiresAt,
            recalled: false,
            metadataCID: metadataCID
        });
        holdingOf[batchId][msg.sender] = quantity;

        emit BatchRegistered(batchId, msg.sender, merkleRoot, quantity, expiresAt);
    }

    /// @notice Recall a batch. Allowed for the regulator or the batch's own manufacturer.
    function recallBatch(bytes32 batchId, string calldata reason) external {
        Batch storage batch = _batches[batchId];
        if (batch.manufacturer == address(0)) revert BatchNotFound(batchId);
        if (batch.recalled) revert AlreadyRecalled(batchId);
        if (!hasRole(REGULATOR_ROLE, msg.sender) && msg.sender != batch.manufacturer) {
            revert NotAuthorisedToRecall(msg.sender, batchId);
        }

        batch.recalled = true;
        emit BatchRecalled(batchId, msg.sender, reason);
    }

    function getBatch(bytes32 batchId) external view returns (Batch memory) {
        return _batches[batchId];
    }

    // ─── Custody ────────────────────────────────────────────────────────────

    /// @notice Ship `quantity` units of a batch to a licensed distributor or pharmacy.
    function transferCustody(bytes32 batchId, address to, uint32 quantity) external {
        _requireActiveBatch(batchId);
        if (!_isSupplyChainParty(msg.sender)) revert NotLicensed(msg.sender);
        if (!hasRole(DISTRIBUTOR_ROLE, to) && !hasRole(PHARMACY_ROLE, to)) {
            revert UnauthorisedRecipient(to);
        }
        if (quantity == 0) revert ZeroQuantity();

        uint32 held = holdingOf[batchId][msg.sender];
        if (held < quantity) revert InsufficientHolding(batchId, msg.sender, held, quantity);

        holdingOf[batchId][msg.sender] = held - quantity;
        holdingOf[batchId][to] += quantity;
        emit CustodyTransferred(batchId, msg.sender, to, quantity);
    }

    /// @notice Record that a pharmacy has dispensed one unit to a patient.
    function markSold(bytes32 batchId, bytes32 unitHash, bytes32[] calldata proof)
        external
        onlyRole(PHARMACY_ROLE)
    {
        _requireActiveBatch(batchId);
        if (!MerkleProof.verifyCalldata(proof, _batches[batchId].merkleRoot, _leaf(unitHash))) {
            revert InvalidUnitProof(batchId, unitHash);
        }
        if (isSold[unitHash]) revert UnitAlreadySold(unitHash);

        uint32 held = holdingOf[batchId][msg.sender];
        if (held == 0) revert InsufficientHolding(batchId, msg.sender, 0, 1);

        holdingOf[batchId][msg.sender] = held - 1;
        isSold[unitHash] = true;
        emit UnitSold(batchId, unitHash, msg.sender);
    }

    // ─── Verification ───────────────────────────────────────────────────────

    /// @notice Verify one unit against its batch root. Free to call; no wallet needed.
    function verifyUnit(bytes32 batchId, bytes32 unitHash, bytes32[] calldata proof)
        external
        view
        returns (UnitStatus memory status)
    {
        Batch storage batch = _batches[batchId];
        if (batch.manufacturer == address(0)) return status; // unknown batch: all fields zero

        status.valid = MerkleProof.verifyCalldata(proof, batch.merkleRoot, _leaf(unitHash));
        status.recalled = batch.recalled;
        status.expired = block.timestamp >= batch.expiresAt;
        status.sold = isSold[unitHash];
        status.manufacturer = batch.manufacturer;
        status.manufacturedAt = batch.manufacturedAt;
        status.expiresAt = batch.expiresAt;
        status.metadataCID = batch.metadataCID;
    }

    // ─── Internal ───────────────────────────────────────────────────────────

    function _leaf(bytes32 unitHash) internal pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(unitHash))));
    }

    function _requireActiveBatch(bytes32 batchId) internal view {
        Batch storage batch = _batches[batchId];
        if (batch.manufacturer == address(0)) revert BatchNotFound(batchId);
        if (batch.recalled) revert BatchIsRecalled(batchId);
        if (block.timestamp >= batch.expiresAt) revert BatchIsExpired(batchId);
    }

    function _isSupplyChainParty(address party) internal view returns (bool) {
        return hasRole(MANUFACTURER_ROLE, party)
            || hasRole(DISTRIBUTOR_ROLE, party)
            || hasRole(PHARMACY_ROLE, party);
    }

    function _requireSupplyChainRole(bytes32 role) internal pure {
        if (role != MANUFACTURER_ROLE && role != DISTRIBUTOR_ROLE && role != PHARMACY_ROLE) {
            revert InvalidRole(role);
        }
    }
}
