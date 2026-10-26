import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBatchDto } from './dto/batch.dto';
import { toBatchId, toUnitHash, buildBatchTree, deriveCodes } from 'src/merkle/merkle';
import { ChainWriterService } from 'src/chain/chain-writer.service';
import { ChainService } from 'src/chain/chain.service';
import { AuthUser } from 'src/auth/types/auth-user';
import { OrgType, ScanResult } from 'src/generated/prisma/enums';
import { isHexString } from 'ethers';                                    
import { ScanContext } from '../clone-detection/types/scan';
import { CloneDetectionService } from 'src/clone-detection/clone-detection.service';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/config/env';
import { QrService } from 'src/qr/qr.service';
import { set } from 'zod';

@Injectable()
export class BatchesService {

    constructor(
        private prismaService: PrismaService,
        private chainWriter: ChainWriterService,
        private chainService: ChainService,
        private cloneDetection: CloneDetectionService,
        private config: ConfigService<Env, true>,
        private qrService: QrService
    ) {}

    async createBatch(batchData: CreateBatchDto, manufacturerId: string) {

        // walletIndex picks the manufacturer's wallet, which signs registerBatch.
        const org = await this.prismaService.organization.findUnique({
            where: { id: manufacturerId }
        });

        if (!org?.walletAddress) {
            throw new ConflictException('Organization is not licensed on-chain yet');
        }

        const batchId = toBatchId(batchData.batchNumber);

        const existingBatch = await this.prismaService.batch.findUnique({
            where: {
                batchId: batchId
            }
        });

        if (existingBatch) {
            throw new ConflictException('Batch with this batch number already exists');
        }

        if (batchData.manufacturingDate >= batchData.expiryDate) {
            throw new BadRequestException('Manufacturing date must be before expiry date');
        }

        const codes = deriveCodes(this.config.get('CODE_SECRET', { infer: true}), batchId, batchData.quantity);
        const unitHashes = codes.map(code => toUnitHash(batchId, code));
        const tree = buildBatchTree(unitHashes);

        const batch = await this.prismaService.batch.create({
            data:{
                batchId: batchId,
                drugName: batchData.drugName,
                batchNumber: batchData.batchNumber,
                merkleRoot: tree.root,
                dosage: batchData.dosage,
                quantity: batchData.quantity,
                mfgDate: batchData.manufacturingDate,
                expiryDate: batchData.expiryDate,
                manufacturerId: manufacturerId,
                units: {
                    createMany: {
                        data: unitHashes.map((unitHash, i) => ({
                            unitHash: unitHash,
                            merkleProof: tree.getProof(i)
                        }))
                    }
                }
            }
        })

        let txHash: string;
        try {
            txHash = await this.chainWriter.registerBatch(org.walletIndex, batch);
        } catch (error) {
            // Not on-chain, so drop it (units cascade) and let the manufacturer retry.
            await this.prismaService.batch.delete({ where: { batchId } });
            throw error;
        }

        const registered = await this.prismaService.batch.update({
            where: { batchId },
            data: { txHash }
        });

        return {
            message: 'Batch created successfully',
            data: {
                batch: registered,
                codes
            }
         };
    }

    async getAllBatches() {
        const batches = await this.prismaService.batch.findMany({
            include: {
                manufacturer: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return {
            message: 'Batches fetched successfully',
            data: batches
        };  
    }

    async getBatchById(batchId: string, user?: AuthUser) {

        if (!user?.org?.id || !batchId) {
            throw new BadRequestException('Invalid request parameters');
        }

        const batch = await this.prismaService.batch.findUnique({
            where: { batchId },
            include: {
                manufacturer: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (!batch || (user.org.type === OrgType.MANUFACTURER && user.org.id !== batch.manufacturerId)) {
            throw new NotFoundException('Batch not found');
        }

        return {
            message: 'Batch fetched successfully',
            data: batch
        };
    }

    async verifyUnit(batchId: string, code: string, ctx: ScanContext) {   
        
        if (!isHexString(batchId, 32)) {
            return {
                message: 'Unit Verification Failed: Invalid Batch ID',
                data: {
                    verdict: 'NOT_REGISTERED',
                    batch: null,
                    manufacturer: null
                }
            }
        }
        
        const unitHash = toUnitHash(batchId, code);

        const unit = await this.prismaService.unit.findUnique({
            where: { unitHash },
            include: { batch: {
                include: {
                    manufacturer: {
                        select: {
                            id: true,
                            city: true,
                            name: true
                        }
                    }
                }  
            }
        }});

        if (!unit) {
            return {
                message: 'Unit Verification Failed: Unit not found',
                data: {
                    verdict: 'NOT_REGISTERED',
                    batch: null,
                    manufacturer: null
                }
            }
        }

        const [status, custody] = await Promise.all([
            this.chainService.verifyUnit(batchId, unitHash, unit.merkleProof as string[]),
            this.prismaService.custodyEvent.findMany({
                where: {
                    batchId: batchId
                },
                orderBy: {
                    occurredAt: 'desc'
                },
                select: {
                    occurredAt: true,
                    toOrg: {
                        select: {
                            name: true,
                            type: true,
                            city: true
                        }
                    }
                }
            })
        ])
        
        const journey = [
            {
                step: 'MANUFACTURED',
                org: unit.batch.manufacturer.name,
                city: unit.batch.manufacturer.city,
                at: unit.batch.mfgDate
            },
            ...custody.map((e) => ({
                step: e.toOrg.type,
                name: e.toOrg.name,
                city: e.toOrg.city,
                at: e.occurredAt,
            })),
            ... (
                unit.soldAt ?
                [{
                    step: 'SOLD',
                    org: null,
                    city: null,
                    at: unit.soldAt
                }] : []
            )
        ] 

        const chainVerdict =
            !status.valid ? ScanResult.NOT_REGISTERED
            : status.recalled ? ScanResult.RECALLED
            : status.expired ? ScanResult.EXPIRED
            : ScanResult.AUTHENTIC;

        const {verdict, risk} = await this.cloneDetection.recordScan(
            {   
                unitHash,
                batchId,
                soldAt: unit.soldAt,
                expiryDate: unit.batch.expiryDate,
            }, 
            chainVerdict, 
            ctx)

        return {
            message: 'Unit Verified From Chain',
            data: {
                verdict: verdict,
                risk: risk,
                journey: journey,
                batch: {
                    batchId: unit.batch.batchId,
                    drugName: unit.batch.drugName,
                    dosage: unit.batch.dosage,
                    mfgDate: unit.batch.mfgDate,
                    expiryDate: unit.batch.expiryDate,
                    batchNumber: unit.batch.batchNumber,
                    status: status.sold,
                    soldAt: unit.soldAt
                },
                manufacturer: {
                    id: unit.batch.manufacturerId,
                    name: unit.batch.manufacturer.name
                },
            }
        }
    }
    
    async getLabels(batchId: string, manufacturerId: string): Promise<Buffer> {
        const batch = await this.prismaService.batch.findUnique({
            where: {
                batchId: batchId
            }
        })

        if (!batch) throw new NotFoundException("Batch Not Found");

        if (batch.manufacturerId !== manufacturerId) throw new ForbiddenException("Only The Batch Manufacturer Can Print This");

        const codes = deriveCodes(this.config.get('CODE_SECRET', { infer: true }), batchId, batch.quantity);

        const firstUnit = await this.prismaService.unit.findUnique({
            where: {
                unitHash: toUnitHash(batchId, codes[0])
            }
        })

        if (!firstUnit) throw new ConflictException("Labels For This Batch Cannot Be Regenerated");

        return this.qrService.labelsPdf(batch, codes)
    }
}