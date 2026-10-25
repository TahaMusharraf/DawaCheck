import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChainService, RegistryEvent } from 'src/chain/chain.service';
import { Env } from 'src/config/env';
import { OrgStatus, UnitStatus } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Mirrors MedicineRegistry events into Postgres. The API already writes a row after
 * each tx it sends; this fills the gaps (a DB write that failed after the tx, or a
 * call made outside the API). Every handler is idempotent, so replaying a block range
 * after a crash is safe.
 */
@Injectable()
export class IndexerService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(IndexerService.name);
  private timer: NodeJS.Timeout | null = null;
  private stopped = false;

  constructor(
    private prismaService: PrismaService,
    private chainService: ChainService,
    private config: ConfigService<Env, true>,
  ) {}

  onApplicationBootstrap() {
    if (!this.chainService.isConfigured()) {
      this.logger.warn('Indexer is off: REGISTRY_ADDRESS is not set');
      return;
    }
    void this.tick();
  }

  onModuleDestroy() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
  }

  // setTimeout instead of setInterval, so a slow pass never overlaps the next one.
  private async tick() {
    try {
      await this.syncOnce();
    } catch (error) {
      this.logger.error('Indexer pass failed', (error as Error).message);
    }
    if (!this.stopped) {
      this.timer = setTimeout(() => void this.tick(), this.config.get('INDEXER_POLL_MS', { infer: true }));
    }
  }

  private async syncOnce() {
    const batchSize = this.config.get('INDEXER_BATCH_SIZE', { infer: true });
    const confirmations = this.config.get('INDEXER_CONFIRMATIONS', { infer: true });

    // The newest blocks can still be reorged away, so stay a few behind the head.
    const head = (await this.chainService.getHeadBlock()) - confirmations;
    let from = (await this.lastProcessedBlock(head)) + 1;

    while (from <= head && !this.stopped) {
      const to = Math.min(from + batchSize - 1, head);
      const events = await this.chainService.getRegistryEvents(from, to);

      // One at a time: a transfer must not be applied before its batch's registration.
      for (const e of events) {
        await this.handle(e);
      }
      // Saved after the range, so a crash replays it; the handlers make that harmless.
      await this.saveCheckpoint(to);

      if (events.length > 0) {
        this.logger.log(`Indexed blocks ${from}-${to}: ${events.length} events`);
      }
      from = to + 1;
    }
  }

  private async handle({ log, event }: RegistryEvent) {
    const txHash = log.transactionHash;

    switch (event.name) {
      case 'BatchRegistered': {
        // Drug details never reach the chain, so a batch missing from the DB can't be rebuilt.
        await this.prismaService.batch.updateMany({
          where: { batchId: event.args.batchId, txHash: null },
          data: { txHash },
        });
        break;
      }

      case 'CustodyTransferred': {
        const { batchId, from, to, quantity } = event.args;
        const [batch, fromOrg, toOrg] = await Promise.all([
          this.prismaService.batch.findUnique({ where: { batchId } }),
          this.orgByWallet(from),
          this.orgByWallet(to),
        ]);
        if (!batch || !fromOrg || !toOrg) {
          this.logger.warn(`Skipping transfer ${txHash}: batch or party not in the DB`);
          break;
        }
        await this.prismaService.custodyEvent.upsert({
          where: { txHash_batchId: { txHash, batchId } },
          update: {},
          create: {
            batchId,
            fromOrgId: fromOrg.id,
            toOrgId: toOrg.id,
            quantity: Number(quantity),
            txHash,
            blockNumber: BigInt(log.blockNumber),
            occurredAt: await this.chainService.getBlockTime(log.blockNumber),
          },
        });
        break;
      }

      case 'UnitSold': {
        await this.prismaService.unit.updateMany({
          where: { unitHash: event.args.unitHash, status: UnitStatus.ISSUED },
          data: {
            status: UnitStatus.SOLD,
            soldAt: await this.chainService.getBlockTime(log.blockNumber),
          },
        });
        break;
      }

      case 'BatchRecalled': {
        const { batchId, issuedBy, reason } = event.args;
        const batch = await this.prismaService.batch.findUnique({ where: { batchId } });
        if (!batch) break;

        await this.prismaService.batch.update({
          where: { batchId },
          data: { recalled: true },
        });

        const issuer = await this.orgByWallet(issuedBy);
        if (!issuer) {
          this.logger.warn(`Recall ${txHash}: issuer ${issuedBy} is not an org in the DB`);
          break;
        }
        await this.prismaService.recall.upsert({
          where: { batchId },
          update: {},
          create: {
            batchId,
            reason,
            issuedByOrgId: issuer.id,
            txHash,
            issuedAt: await this.chainService.getBlockTime(log.blockNumber),
          },
        });
        break;
      }

      case 'PartyLicensed': {
        await this.prismaService.organization.updateMany({
          where: { walletAddress: event.args.party, licenseTxHash: null },
          data: { status: OrgStatus.LICENSED, licenseTxHash: txHash },
        });
        break;
      }

      case 'PartyRevoked': {
        await this.prismaService.organization.updateMany({
          where: { walletAddress: event.args.party },
          data: { status: OrgStatus.REVOKED },
        });
        break;
      }
    }
  }

  /** Wallets are stored checksummed, and ethers decodes event addresses the same way. */
  private orgByWallet(address: string) {
    return this.prismaService.organization.findUnique({
      where: { walletAddress: address },
    });
  }

  private checkpointKey() {
    return {
      contractAddress: this.config.get('REGISTRY_ADDRESS', { infer: true })!,
      chainId: this.config.get('CHAIN_ID', { infer: true }),
    };
  }

  private async lastProcessedBlock(head: number): Promise<number> {
    const checkpoint = await this.prismaService.indexerCheckpoint.findUnique({
      where: { contractAddress_chainId: this.checkpointKey() },
    });
    if (checkpoint) return Number(checkpoint.lastBlockProcessed);

    const start = this.config.get('INDEXER_START_BLOCK', { infer: true });
    if (start === 0) {
      // Scanning a public testnet from genesis would take days, so only follow new blocks.
      this.logger.warn('INDEXER_START_BLOCK is not set: indexing from the current block');
      return head;
    }
    return start - 1;
  }

  private async saveCheckpoint(block: number) {
    const key = this.checkpointKey();
    await this.prismaService.indexerCheckpoint.upsert({
      where: { contractAddress_chainId: key },
      update: { lastBlockProcessed: BigInt(block) },
      create: { ...key, lastBlockProcessed: BigInt(block) },
    });
  }
}
