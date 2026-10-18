import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBatchDto } from './dto/batch.dto';
import { toBatchId, toUnitHash, buildBatchTree, generateCodes } from 'src/merkle/merkle';
import { ChainWriterService } from 'src/chain/chain-writer.service';
import { ChainService } from 'src/chain/chain.service';
import { AuthUser } from 'src/auth/types/auth-user';
import { OrgType } from 'src/generated/prisma/browser';
import { isHexString } from 'node_modules/ethers/lib.esm/utils/data';

@Injectable()
export class BatchesService {

    constructor(
        private prismaService: PrismaService,
        private chainWriter: ChainWriterService,
        private chainService: ChainService
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

        const codes = generateCodes(batchData.quantity);
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

    async verifyUnit(batchId: string, code: string) {   
        
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

        const status = await this.chainService.verifyUnit(batchId, unitHash, unit.merkleProof as string[]);
    
        const verdict =
            !status.valid ? 'NOT_REGISTERED'
            : status.recalled ? 'RECALLED'
            : status.expired ? 'EXPIRED'
            : status.sold ? 'SOLD'
            : 'AUTHENTIC';

        return {
            message: 'Unit Verified From Chain',
            data: {
                verdict: verdict,
                batch: {
                    batchId: unit.batch.batchId,
                    drugName: unit.batch.drugName,
                    dosage: unit.batch.dosage,
                    mfgDate: unit.batch.mfgDate,
                    expiryDate: unit.batch.expiryDate,
                    batchNumber: unit.batch.batchNumber,
                },
                manufacturer: {
                    id: unit.batch.manufacturerId,
                    name: unit.batch.manufacturer.name
                },
            }
        }
    }
    
}