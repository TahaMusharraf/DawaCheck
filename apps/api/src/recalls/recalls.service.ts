import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RecallDto } from './dto/recall.dto';
import { AuthUser } from 'src/auth/types/auth-user';
import { OrgType } from 'src/generated/prisma/enums';
import { ChainWriterService } from 'src/chain/chain-writer.service';
import { ChainService } from 'src/chain/chain.service';

@Injectable()
export class RecallsService {
    private readonly logger = new Logger(RecallsService.name)

    constructor( 
        private prismaService: PrismaService,
        private chainWriter: ChainWriterService,
        private chainService: ChainService
    ) {}

    async recallBatch(dto: RecallDto, user: AuthUser) {
        const batch = await this.prismaService.batch.findUnique({
            where: {
                batchId: dto.batchId
            }
        })

        if (!batch || (user.org.type === OrgType.MANUFACTURER && user.org.id !== batch.manufacturerId)) {
            throw new NotFoundException('Batch not found');
        }

        if (batch.recalled) throw new ConflictException("Batch Already Recalled");

        let txHash: string;
        if (user.org.type === OrgType.MANUFACTURER) {
            const organizaion = await this.prismaService.organization.findUnique({
                where: {
                    id: user.org.id
                }
            })
            if (!organizaion?.walletAddress) throw new NotFoundException("Your Organization Has No Wallet Address");
            txHash = await this.chainWriter.recallBatch(
                dto.batchId,
                dto.reason,
                organizaion.walletIndex
            )
        } else {
            txHash = await this.chainWriter.recallBatch(
                dto.batchId,
                dto.reason
            )
        }

        const [, recall] = await this.prismaService.$transaction([
            this.prismaService.batch.update({
                where: {
                    batchId: dto.batchId
                },
                data: {
                    recalled: true
                }
            }),
            this.prismaService.recall.create({
                data:{
                    batchId: dto.batchId,
                    reason: dto.reason,
                    issuedByOrgId: user.org.id,
                    txHash: txHash,
                    issuedAt: new Date()
                }
            })
        ]);

        const events = await this.prismaService.custodyEvent.findMany({
            where: {
                batchId: dto.batchId
            },
            select:{
                toOrg:{
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        walletAddress: true
                    }
                }
            }
        });

        const manufacturer = await this.prismaService.organization.findUnique({
            where:{
                id: batch.manufacturerId
            },
            select: {
                id: true,
                name: true,
                type: true,
                walletAddress: true                
            }
        })

        const organizations = new Map(
            [manufacturer, ...events.map((e) => e.toOrg)]
            .filter((o) => o?.walletAddress)
            .map((o) => [o!.id, o!])
        )

        const affected = (await Promise.all(
            [...organizations.values()].map(async (o) => ({
                id: o.id, 
                name: o.name,
                type: o.type,
                held: await this.chainService.holdingOf(dto.batchId, o.walletAddress!),
            }))
        )).filter((o) => o.held > 0)

        return {
            message: "Batch Recalled Successfully",
            data: {
                recall: recall,
                affected: affected
            }
        }
    }

    async listRecalls(user: AuthUser) {

        const organization = await this.prismaService.organization.findUnique({
            where:{
                id: user.org.id
            }
        }) 

        if (!organization) throw new NotFoundException("Your Organization Does Not Exist");

        let recalls;
        if (user.org.type === OrgType.REGULATOR) {
            recalls = await this.prismaService.recall.findMany({
                include: {
                    batch: {
                        select: {
                            batchNumber: true,
                            drugName: true,
                            dosage: true
                        }
                    },
                    issuedBy: {
                        select: {
                            name: true,
                            type: true
                        }
                    }
                },
                orderBy: {
                    issuedAt: 'desc'
                }
            });
        } else if (user.org.type === OrgType.MANUFACTURER) {
            recalls = await this.prismaService.recall.findMany({
                where: {
                    batch: {
                        manufacturerId: user.org.id
                    }
                },
                include: {
                    batch: {
                        select: {
                            batchNumber: true,
                            drugName: true,
                            dosage: true
                        }
                    },
                    issuedBy: {
                        select: {
                            name: true,
                            type: true
                        }
                    }
                },
                orderBy: {
                    issuedAt: 'desc'
                }
            });
        } else {
            recalls = await this.prismaService.recall.findMany({
                where: {
                    batch: {
                        custodyEvents: {
                            some:{
                                toOrgId: user.org.id
                            }
                        }
                    }
                },
                include: {
                    batch: {
                        select: {
                            batchNumber: true,
                            drugName: true,
                            dosage: true
                        }
                    },
                    issuedBy: {
                        select: {
                            name: true,
                            type: true
                        }
                    }
                },
                orderBy: {
                    issuedAt: 'desc'
                }                
            })
        }

        const withHeld = await Promise.all(recalls.map(async(r) => ({
            ...r,
            held:  organization.walletAddress ?
                await this.chainService.holdingOf(r.batchId, organization.walletAddress)
                : 0,
        })))


        if (user.org.type === OrgType.REGULATOR) {
            return {
                message: `${user.org.type}: Recalled Batches Fetched Successfully`, 
                recalls: recalls 
            };
        }


        return {
            message: `${user.org.type}: Recalled Batches Fetched Successfully`,
            recalls: withHeld,
        }
    }
}
