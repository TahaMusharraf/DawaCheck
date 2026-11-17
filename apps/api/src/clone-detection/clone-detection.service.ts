import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/config/env';
import { PrismaService } from 'src/prisma/prisma.service';
import { ScanContext, ScanRisk } from './types/scan';
import { AlertStatus, ScanResult } from 'src/generated/prisma/enums';
import { createHash } from 'crypto';
import {
  CLONE_THRESHOLD,
  PastScan,
  scoreRisk,
  WARNING_THRESHOLD,
} from './rule';

@Injectable()
export class CloneDetectionService {
  constructor(
    private prismaService: PrismaService,
    private config: ConfigService<Env, true>,
  ) {}

  async recordScan(
    unit: {
      unitHash: string;
      batchId: string;
      soldAt: Date | null;
      expiryDate: Date;
    },
    chainVerdict: ScanResult,
    ctx: ScanContext,
  ): Promise<{ verdict: ScanResult; risk: ScanRisk }> {
    const [dismissedAlert, activeAlert] = await Promise.all([
      this.prismaService.counterfeitAlert.findFirst({
        where: {
          unitHash: unit.unitHash,
          status: AlertStatus.DISMISSED,
          resolvedAt: { not: null },
        },
        orderBy: {
          resolvedAt: 'desc',
        },
        select: { resolvedAt: true },
      }),
      this.prismaService.counterfeitAlert.findFirst({
        where: {
          unitHash: unit.unitHash,
          status: {
            in: [
              AlertStatus.OPEN,
              AlertStatus.INVESTIGATING,
              AlertStatus.CONFIRMED,
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      }),
    ]);

    const history = await this.prismaService.scanEvent.findMany({
      where: {
        unitHash: unit.unitHash,
        scannedAt: dismissedAlert?.resolvedAt
          ? { gt: dismissedAlert.resolvedAt }
          : undefined,
      },
      orderBy: { scannedAt: 'asc' },
      select: {
        city: true,
        lat: true,
        lng: true,
        deviceHash: true,
        scannedAt: true,
      },
    });

    const current: PastScan = {
      city: ctx.city ?? null,
      lat: ctx.lat ?? null,
      lng: ctx.lng ?? null,
      deviceHash: this.hash(ctx.deviceId),
      scannedAt: new Date(),
    };

    const { score, flags } = scoreRisk({
      history,
      current,
      soldAt: unit.soldAt,
      expiryDate: unit.expiryDate,
    });

    const verdict =
      chainVerdict === ScanResult.AUTHENTIC &&
      (score >= CLONE_THRESHOLD || activeAlert !== null)
        ? ScanResult.CLONE_SUSPECTED
        : chainVerdict;

    await this.prismaService.scanEvent.create({
      data: {
        unitHash: unit.unitHash,
        result: verdict,
        ipHash: this.hash(ctx.ip),
        deviceHash: this.hash(ctx.deviceId),
        city: ctx.city,
        lat: ctx.lat,
        lng: ctx.lng,
        riskScore: score,
        riskFlags: flags,
      },
    });

    if (score >= CLONE_THRESHOLD && !activeAlert) {
      await this.prismaService.counterfeitAlert.create({
        data: {
          unitHash: unit.unitHash,
          batchId: unit.batchId,
          ruleTriggered: flags.join(','),
          severity: score,
          city: ctx.city,
        },
      });
    }

    return {
      verdict,
      risk: {
        score,
        flags,
        warning: score >= WARNING_THRESHOLD && score < CLONE_THRESHOLD,
      },
    };
  }

  private hash(value: string) {
    const salt = this.config.get('SCAN_HASH_SALT', { infer: true });
    return createHash('sha256')
      .update(salt + value)
      .digest('hex');
  }
}
