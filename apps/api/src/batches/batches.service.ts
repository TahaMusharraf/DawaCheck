import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBatchDto } from './dto/batch.dto';
import { toBatchId, toUnitHash, buildBatchTree, generateCodes } from 'src/merkle/merkle';
import { ChainWriterService } from 'src/chain/chain-writer.service';

@Injectable()
export class BatchesService {

    constructor(
        private prismaService: PrismaService,
        private chainWriter: ChainWriterService,
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
}