import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  async function build(
    env: Record<string, unknown>,
    queryRaw: () => Promise<unknown> = () => Promise.resolve([{ '?column?': 1 }]),
  ) {
    const moduleRef = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: ConfigService, useValue: { get: (key: string) => env[key] } },
        { provide: PrismaService, useValue: { $queryRaw: queryRaw } },
      ],
    }).compile();

    return moduleRef.get(HealthService);
  }

  it('reports the chain and contract it is pointed at', async () => {
    const service = await build({
      CHAIN_ID: 80002,
      REGISTRY_ADDRESS: '0xD95A8B612971667888beB641e79Ad84D481367DA',
    });

    const status = service.check();
    expect(status.status).toBe('ok');
    expect(status.chainId).toBe(80002);
    expect(status.registryAddress).toBe(
      '0xD95A8B612971667888beB641e79Ad84D481367DA',
    );
  });

  it('reports a null address before the contract is configured', async () => {
    const service = await build({ CHAIN_ID: 31337 });
    expect(service.check().registryAddress).toBeNull();
  });

  it('reports the database as up when the query succeeds', async () => {
    const service = await build({ CHAIN_ID: 31337 });
    await expect(service.ready()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
  });

  it('reports degraded instead of throwing when the database is unreachable', async () => {
    const service = await build({ CHAIN_ID: 31337 }, () =>
      Promise.reject(new Error('connection refused')),
    );
    await expect(service.ready()).resolves.toEqual({
      status: 'degraded',
      database: 'down',
    });
  });
});
