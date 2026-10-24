import {
  BadGatewayException,
  HttpException,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Contract,
  formatEther,
  HDNodeWallet,
  id,
  isError,
  JsonRpcProvider,
  Mnemonic,
  NonceManager,
  parseEther,
  type TransactionReceipt,
  Wallet,
  type TransactionResponse,
} from 'ethers';
import type { Env } from '../config/env';
import type { OrgType } from '../generated/prisma/enums';
import abi from './abi/medicine-registry.abi.json';

const REGULATOR_ROLE = id('REGULATOR_ROLE');
const LOW_BALANCE = parseEther('0.2');

/**
 * Sends transactions to MedicineRegistry. The regulator key signs licensing and
 * funding; org wallets are derived from WALLET_MNEMONIC and never stored.
 * Kept apart from ChainService so only modules that need to write get the keys.
 */
@Injectable()
export class ChainWriterService implements OnModuleInit {
  private readonly logger = new Logger(ChainWriterService.name);
  private readonly provider: JsonRpcProvider;
  private readonly signer: NonceManager | null = null;
  private readonly registry: Contract | null = null;
  private readonly mnemonic: string | null = null;
  private readonly fundingAmount: bigint;

  constructor(config: ConfigService<Env, true>) {
    this.provider = new JsonRpcProvider(
      config.get('RPC_URL', { infer: true }),
      config.get('CHAIN_ID', { infer: true }),
    );
    // Parsed once so a bad value fails at startup, not on the first approval.
    this.fundingAmount = parseEther(
      config.get('ORG_WALLET_FUNDING', { infer: true }),
    );

    const registryAddress = config.get('REGISTRY_ADDRESS', { infer: true });
    const privateKey = config.get('REGULATOR_PRIVATE_KEY', { infer: true });
    const mnemonic = config.get('WALLET_MNEMONIC', { infer: true })?.trim();

    if (!registryAddress || !privateKey || !mnemonic) return;
    if (!Mnemonic.isValidMnemonic(mnemonic)) {
      this.logger.error('WALLET_MNEMONIC is not a valid BIP-39 phrase');
      return;
    }

    // NonceManager hands out nonces locally so two approvals at once don't collide.
    this.signer = new NonceManager(new Wallet(privateKey, this.provider));
    this.registry = new Contract(registryAddress, abi, this.signer);
    this.mnemonic = mnemonic;
  }

  async onModuleInit() {
    if (!this.signer || !this.registry) {
      this.logger.warn(
        'Chain writes are disabled: set REGISTRY_ADDRESS, REGULATOR_PRIVATE_KEY and WALLET_MNEMONIC',
      );
      return;
    }

    // Catch a wrong key or an empty wallet now, not when the first approval fails.
    try {
      const address = await this.signer.getAddress();
      const [balance, isRegulator] = await Promise.all([
        this.provider.getBalance(address),
        this.registry.hasRole(REGULATOR_ROLE, address) as Promise<boolean>,
      ]);

      if (!isRegulator) {
        this.logger.error(
          `${address} does not hold REGULATOR_ROLE on the registry: approvals will fail`,
        );
      }
      const message = `Regulator ${address} balance ${formatEther(balance)} POL`;
      if (balance < LOW_BALANCE) {
        this.logger.warn(`${message}: top it up from the Amoy faucet`);
      } else {
        this.logger.log(message);
      }
    } catch (error) {
      this.logger.error(
        'Could not check the regulator wallet',
        (error as Error).message,
      );
    }
  }

  /** The custodial wallet for an org, at m/44'/60'/0'/0/{index}. */
  orgWallet(index: number): HDNodeWallet {
    if (!this.mnemonic) {
      throw new ServiceUnavailableException(
        'Chain writes are not configured: set WALLET_MNEMONIC',
      );
    }
    return HDNodeWallet.fromPhrase(
      this.mnemonic,
      undefined,
      `m/44'/60'/0'/0/${index}`,
    ).connect(this.provider);
  }

  /** Grants the org's supply-chain role on-chain. Returns the tx hash. */
  licenseParty(
    address: string,
    type: OrgType,
    licenseNo: string,
  ): Promise<string> {
    const registry = this.writableRegistry();
    return this.send('licenseParty', () =>
      registry.licenseParty(address, roleFor(type), licenseNo),
    ).then((receipt) => receipt.hash);
  }

  /** Removes the org's supply-chain role on-chain. Returns the tx hash. */
  revokeParty(address: string, type: OrgType): Promise<string> {
    const registry = this.writableRegistry();
    return this.send('revokeParty', () =>
      registry.revokeParty(address, roleFor(type)),
    ).then((receipt) => receipt.hash);
  }

  /**
   * Anchors a batch's Merkle root on-chain, signed by the manufacturer's own
   * wallet so it passes onlyRole(MANUFACTURER_ROLE). Returns the tx hash.
   */
  registerBatch(
    walletIndex: number,
    batch: {
      batchId: string;
      merkleRoot: string;
      quantity: number;
      mfgDate: Date;
      expiryDate: Date;
    },
  ): Promise<string> {
    const registry = this.writableRegistry().connect(
      this.orgWallet(walletIndex),
    ) as Contract;
    return this.send('registerBatch', () =>
      registry.registerBatch(
        batch.batchId,
        batch.merkleRoot,
        batch.quantity,
        toUnixSeconds(batch.mfgDate),
        toUnixSeconds(batch.expiryDate),
        // metadataCID: filled in once IPFS uploads exist.
        '',
      ),
    ).then((receipt) => receipt.hash);
  }

  /** Moves units of a batch to a licensed distributor or pharmacy, 
  * signed by the sender's wallet. Returns the receipt. */
  transferCustody(
    walletIndex: number,
    batchId: string,
    to: string,
    quantity: number,
  ): Promise<TransactionReceipt> {
    const registry = this.writableRegistry().connect(
      this.orgWallet(walletIndex),
    ) as Contract;
    return this.send('transferCustody', () =>
      registry.transferCustody(
        batchId, 
        to, 
        quantity
      ),
    );
  }

  /** Sends ORG_WALLET_FUNDING POL so a new org can pay its own gas. */
  fundWallet(address: string): Promise<string> {
    const signer = this.writableSigner();
    return this.send('fundWallet', () =>
      signer.sendTransaction({ to: address, value: this.fundingAmount }),
    ).then((receipt) => receipt.hash);
  }
  
  markSold(
    walletIndex: number, 
    batchId: string,
    unitHash: string,
    proof: string[]
  ): Promise<string> {
    const registry = this.writableRegistry().connect(
      this.orgWallet(walletIndex),
    ) as Contract;
    return this.send('markSold', () =>
      registry.markSold(
        batchId,
        unitHash,
        proof
      ),
    ).then((receipt) => receipt.hash)
  }

  recallBatch(
    batchId: string,
    reason: string,
    walletIndex?: number,
  ): Promise<string> {
    const registry = walletIndex === undefined 
      ? this.writableRegistry()
      : this.writableRegistry().connect(
        this.orgWallet(walletIndex)
      ) as Contract;
    return this.send('recallBatch', () =>
      registry.recallBatch(
        batchId,
        reason
      )
    ).then((receipt) => receipt.hash)
  }

  /** Submits a tx, waits for it to be mined and turns chain errors into a 502. */
  private async send(
    action: string,
    submit: () => Promise<TransactionResponse>,
  ): Promise<TransactionReceipt> {
    try {
      const tx = await submit();
      this.logger.log(`${action}: sent ${tx.hash}`);

      const receipt = await tx.wait();
      if (!receipt || receipt.status !== 1) {
        throw new BadGatewayException(`${action} failed on-chain (${tx.hash})`);
      }
      return receipt;
    } catch (error) {
      // A tx that failed before broadcast still used up a local nonce; resync it.
      this.signer?.reset();
      if (error instanceof HttpException) throw error;

      const reason = describeChainError(error);
      this.logger.error(`${action} failed: ${reason}`);
      throw new BadGatewayException(`Chain rejected ${action}: ${reason}`);
    }
  }

  private writableRegistry(): Contract {
    if (!this.registry) {
      throw new ServiceUnavailableException('Chain writes are not configured');
    }
    return this.registry;
  }

  private writableSigner(): NonceManager {
    if (!this.signer) {
      throw new ServiceUnavailableException('Chain writes are not configured');
    }
    return this.signer;
  }
}

/** Role hashes as the contract defines them: keccak256("<NAME>_ROLE"). */
function roleFor(type: OrgType): string {
  switch (type) {
    case 'MANUFACTURER':
      return id('MANUFACTURER_ROLE');
    case 'DISTRIBUTOR':
      return id('DISTRIBUTOR_ROLE');
    case 'PHARMACY':
      return id('PHARMACY_ROLE');
    default:
      // licenseParty only accepts supply-chain roles.
      throw new Error(
        `Organisations of type ${type} are not licensed on-chain`,
      );
  }
}

/** The contract stores uint64 unix seconds; JS dates are milliseconds. */
function toUnixSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/** A short, safe reason: custom error name, revert string, or ethers' summary. */
function describeChainError(error: unknown): string {
  if (isError(error, 'CALL_EXCEPTION')) {
    return error.revert?.name ?? error.reason ?? 'execution reverted';
  }
  if (isError(error, 'INSUFFICIENT_FUNDS')) {
    return 'Wallet is out of POL';
  }
  const short = (error as { shortMessage?: string }).shortMessage;
  return short ?? (error instanceof Error ? error.message : 'unknown error');
}
