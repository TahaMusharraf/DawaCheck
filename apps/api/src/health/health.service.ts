import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthStatus {
  status: 'ok';
  uptime: number;
  chainId: number;
  registryAddress: string | null;
  timestamp: string;
}

export interface ReadinessStatus {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
  ) {}

  /** Liveness: cheap and dependency-free, so a sleeping Render service wakes fast. */
  check(): HealthStatus {
    return {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      chainId: this.config.get('CHAIN_ID', { infer: true }),
      registryAddress: this.config.get('REGISTRY_ADDRESS', { infer: true }) ?? null,
      timestamp: new Date().toISOString(),
    };
  }

  /** Readiness: does the API actually reach PostgreSQL? */
  async ready(): Promise<ReadinessStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'up' };
    } catch (error) {
      this.logger.error('Database health check failed', error as Error);
      return { status: 'degraded', database: 'down' };
    }
  }
}
