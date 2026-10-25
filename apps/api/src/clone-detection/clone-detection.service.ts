import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/config/env';
import { PrismaService } from 'src/prisma/prisma.service';
import { ScanContext, ScanRisk } from './types/scan';
import { AlertStatus, ScanResult } from 'src/generated/prisma/enums';
import { createHash } from 'crypto';
import { CLONE_THRESHOLD, PastScan, RuleInput, RULES, WARNING_THRESHOLD } from './rule';

@Injectable()
export class CloneDetectionService {
    
    constructor(
        private prismaService: PrismaService,
        private config: ConfigService<Env, true>
    ) {}

    async recordScan(
        unit: {
            unitHash: string,
            batchId: string,
            soldAt: Date | null,
            expiryDate: Date
        }, 
        chainVerdict: ScanResult, 
        ctx: ScanContext
    ): Promise<{ verdict: ScanResult, risk: ScanRisk}> {

        const [history, batch] = await Promise.all([
            this.prismaService.scanEvent.findMany({
                where: {
                    unitHash: unit.unitHash
                },
                orderBy: {
                    scannedAt: 'asc'
                },
                select: {
                    city: true,
                    lat: true,
                    lng: true,
                    deviceHash: true,
                    scannedAt: true
                }
            }),
            this.prismaService.batch.findUnique({
                where: {
                    batchId: unit.batchId
                },
                select: {
                    manufacturer: {
                        select: {
                            city: true
                        }
                    },
                    custodyEvents: {
                        select: {
                            toOrg: {
                                select: {
                                    city: true
                                }
                            } 
                        }
                    }
                }
            })
        ])

        const custodyCities = new Set(
            [batch?.manufacturer.city, ...(batch?.custodyEvents.map((e) => e.toOrg.city) ?? [])]
            .filter((c): c is string => !!c)
            .map((c) => c.trim().toLowerCase())
        )

        const current: PastScan = {
            city: ctx.city ?? null,
            lat: ctx.lat ?? null,
            lng: ctx.lng ?? null,
            deviceHash: this.hash(ctx.deviceId),
            scannedAt: new Date(),
        };

        const input: RuleInput = {
            history: history,
            current: current,
            custodyCities: custodyCities,
            soldAt: unit.soldAt,
            expiryDate: unit.expiryDate
        }

        const flags: string[] = [];
        let score = 0;
        
        for (const rule of RULES) {
        const weight = rule.check(input);
            if (weight > 0) {
                score += weight;
                flags.push(rule.flag);
            }
        }

        const verdict = 
            chainVerdict === ScanResult.AUTHENTIC && score >= CLONE_THRESHOLD
            ? ScanResult.CLONE_SUSPECTED
            : chainVerdict;

        await this.prismaService.scanEvent.create({
            data: {
                unitHash: unit.unitHash,
                result: chainVerdict,
                ipHash: this.hash(ctx.ip),
                deviceHash: this.hash(ctx.deviceId),
                city: ctx.city,
                lat: ctx.lat,
                lng: ctx.lng,
                riskScore: score,
                riskFlags: flags
            }
        })

        if (score >= CLONE_THRESHOLD) {
            const open = await this.prismaService.counterfeitAlert.findFirst({
                where: {
                    unitHash: unit.unitHash,
                    status: AlertStatus.OPEN
                }
            });
            if(!open) {
                await this.prismaService.counterfeitAlert.create({
                    data: {
                        unitHash: unit.unitHash,
                        batchId: unit.batchId,
                        ruleTriggered: flags.join(','),
                        severity: score,
                        city: ctx.city
                    }
                })
            }
        }

        return {
            verdict,
            risk: {
                score,
                flags,
                warning: score >= WARNING_THRESHOLD && score < CLONE_THRESHOLD,
            }
        }
    }

    private hash(value: string) {
        const salt = this.config.get('SCAN_HASH_SALT', { infer: true });
        return createHash('sha256').update(salt + value).digest('hex');
  }
}
