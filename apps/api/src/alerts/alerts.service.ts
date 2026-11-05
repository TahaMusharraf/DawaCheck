import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ListAlertsDto } from './dto/alerts.dto';
import { AlertStatus } from 'src/generated/prisma/enums';

const NEXT: Record<AlertStatus, AlertStatus[]> = {
    OPEN: [AlertStatus.INVESTIGATING, AlertStatus.CONFIRMED, AlertStatus.DISMISSED],
    INVESTIGATING: [AlertStatus.CONFIRMED, AlertStatus.DISMISSED],
    CONFIRMED: [],
    DISMISSED: []
};

@Injectable()
export class AlertsService {

    constructor( 
        private prismaService: PrismaService
    ) {}

    async listAlerts(status?: AlertStatus) {
        const alerts = await this.prismaService.counterfeitAlert.findMany({
            where: {
                status: status
            },
            orderBy: {
                createdAt: "desc"
            },
            include: {
                batch: {
                    select: {
                        batchNumber: true,
                        drugName: true,
                        manufacturer: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        })
    
        return {
            message: "Alerts Fetched Successfully",
            alerts: alerts
        };
    }

    async getAlert(id: string) {
        const alert = await this.prismaService.counterfeitAlert.findUnique({
            where: {
                id: id
            },
            include: {
                batch: {
                    select: {
                        batchNumber: true,
                        drugName: true,
                        manufacturer: {
                            select: {
                                name: true
                            }
                        }
                    }
                }, 
                unit: {
                    select: {
                        scans: {
                            orderBy: {
                                scannedAt: 'asc'
                            },
                            select: {
                                scannedAt: true,
                                city: true,
                                lat: true,
                                lng: true,
                                result: true,
                                riskFlags: true,
                                riskScore: true
                            }
                        }
                    }
                }
            }            
        })

        if (!alert) throw new NotFoundException("Alert Not Found");

        return {
            message: "Alert Fetched Successfully",
            alert: alert
        };
    }

    async updateAlert(id: string, status: AlertStatus) {
        const alert = await this.prismaService.counterfeitAlert.findUnique({
            where: {
                id: id
            }
        })

        if (!alert) throw new NotFoundException("Alert Not Found");

        if (!NEXT[alert.status].includes(status)) {
            throw new BadRequestException(`Cannot Move Along From ${alert.status} To ${status}`)
        }

        const closed = status === AlertStatus.CONFIRMED || status === AlertStatus.DISMISSED;

        const updated = await this.prismaService.counterfeitAlert.update({
            where: {
                id: id
            },
            data: {
                status: status,
                resolvedAt: closed ? new Date() : null
            }
        })

        return {
            message: "Alert Updated Successfully",
            alert: updated
        }
    }
}
