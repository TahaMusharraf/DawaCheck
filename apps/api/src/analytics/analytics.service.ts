import { Injectable } from '@nestjs/common';
import { ScanResult } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AnalyticsService {

    constructor (
        private prismaService: PrismaService
    ) {}
    
    async overview() {
        const [orgs, batches, recalls,
            units, scans, alerts
        ] = await Promise.all([
            this.prismaService.organization.groupBy({
                by: ['type', 'status'],
                _count: { _all: true}
            }),
            this.prismaService.batch.count(),
            this.prismaService.recall.count(),
            this.prismaService.unit.groupBy({
                by: ['status'],
                _count: { _all: true }
            }),
            this.prismaService.scanEvent.groupBy({
                by: ['result'],
                _count: { _all: true }
            }),
            this.prismaService.counterfeitAlert.groupBy({
                by: ['status'],
                _count: { _all: true }
            })
        ])

        return {
            message: "Overview Of the Data Fetched",
            orgs, batches, recalls, units, scans, alerts
        }
    }

    async heatmap(days: number) {

        const since = new Date(Date.now() - days * 86_400_000)

        const scans = await this.prismaService.scanEvent.groupBy({
            by: ['city'],
            where: {
                scannedAt: { gte: since },
                city: { not: null },
                result: { not: ScanResult.AUTHENTIC },
            },
            _count: { _all: true },
            _avg: { lat: true, lng: true }
        })

        return {
            message: "Heatmap Fetched Successfully",
            scans: scans
        }
    }
}
