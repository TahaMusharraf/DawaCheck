import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Contract, JsonRpcProvider, keccak256, toUtf8Bytes } from 'ethers';
import type { Env } from '../config/env';
import abi from './abi/medicine-registry.abi.json';
import {
  BatchOnChain,
  isRegistered,
  RawBatch,
  RawUnitStatus,
  toBatchOnChain,
  toUnitStatusOnChain,
  UnitStatusOnChain,
} from './types/chain.types';

/**
 * Read-only access to MedicineRegistry. Every call here is a free view call:
 * no gas, no wallet. Writing transactions (licensing, registering batches) is a
 * separate concern and will live alongside the custodial signer.
 */
@Injectable()
export class ChainService implements OnModuleInit {
  private readonly logger = new Logger(ChainService.name);
  private readonly provider: JsonRpcProvider;
  private readonly registryAddress: string | undefined;
  private readonly contract: Contract | null;

  constructor(private readonly config: ConfigService<Env, true>) {
    const rpcUrl = config.get('RPC_URL', { infer: true });
    const chainId = config.get('CHAIN_ID', { infer: true });

    // Passing the network up front saves a round trip and pins the expected chain.
    this.provider = new JsonRpcProvider(rpcUrl, chainId);
    this.registryAddress = config.get('REGISTRY_ADDRESS', { infer: true });
    this.contract = this.registryAddress
      ? new Contract(this.registryAddress, abi, this.provider)
      : null;
  }

  async onModuleInit() {
    if (!this.contract) {
      this.logger.warn(
        'REGISTRY_ADDRESS is not set: chain reads are disabled until it is configured',
      );
      return;
    }

    // Fail loudly at startup if .env points at the wrong network or a dead RPC.
    try {
      const network = await this.provider.getNetwork();
      const expected = this.config.get('CHAIN_ID', { infer: true });
      if (Number(network.chainId) !== expected) {
        this.logger.error(
          `RPC_URL is chain ${network.chainId} but CHAIN_ID is ${expected}`,
        );
        return;
      }
      this.logger.log(
        `Registry ${this.registryAddress} on chain ${network.chainId}`,
      );
    } catch (error) {
      this.logger.error(
        `Cannot reach RPC at ${this.config.get('RPC_URL', { infer: true })}`,
        error as Error,
      );
    }
  }

  /** batchId = keccak256 of the human-readable batch number, as the contract expects. */
  toBatchId(batchNumber: string): string {
    return keccak256(toUtf8Bytes(batchNumber));
  }

  /** Whether the API is configured to reach a deployed registry. */
  isConfigured(): boolean {
    return this.contract !== null;
  }

  async getChainStatus() {
    const network = await this.provider.getNetwork();
    const blockNumber = await this.provider.getBlockNumber();

    return {
      chainId: Number(network.chainId),
      blockNumber,
      registryAddress: this.registryAddress ?? null,
    };
  }

  /** Returns null when the batch was never registered. */
  async getBatch(batchId: string): Promise<BatchOnChain | null> {
    const raw = (await this.registry().getBatch(batchId)) as RawBatch;
    return isRegistered(raw.manufacturer) ? toBatchOnChain(raw) : null;
  }

  /**
   * The verification call behind every QR scan. Never throws for a fake code:
   * an unknown batch or bad proof comes back with valid = false.
   */
  async verifyUnit(
    batchId: string,
    unitHash: string,
    proof: string[],
  ): Promise<UnitStatusOnChain> {
    const raw = (await this.registry().verifyUnit(
      batchId,
      unitHash,
      proof,
    )) as RawUnitStatus;
    return toUnitStatusOnChain(raw);
  }

  /** How many units of a batch a party currently holds. */
  async holdingOf(batchId: string, holder: string): Promise<number> {
    const held = (await this.registry().holdingOf(batchId, holder)) as bigint;
    return Number(held);
  }

  async isSold(unitHash: string): Promise<boolean> {
    return (await this.registry().isSold(unitHash)) as boolean;
  }

  private registry(): Contract {
    if (!this.contract) {
      throw new ServiceUnavailableException(
        'Chain access is not configured: set REGISTRY_ADDRESS',
      );
    }
    return this.contract;
  }
}
