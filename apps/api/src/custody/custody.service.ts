import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SellUnitDto, TransferCustodyDto } from './dto/custody.dto';
import { type AuthUser } from 'src/auth/types/auth-user';
import { OrgStatus, OrgType, UnitStatus } from 'src/generated/prisma/enums';
import { ChainWriterService } from 'src/chain/chain-writer.service';
import { ChainService } from 'src/chain/chain.service';
import { userInfo } from 'os';
import { toUnitHash } from 'src/merkle/merkle';

@Injectable()
export class CustodyService {
    private  readonly logger = new Logger(CustodyService.name)

    constructor(
        private prismaService: PrismaService,
        private chainWWriter: ChainWriterService,
        private chainService: ChainService,
    ) {}

    async transfer(dto: TransferCustodyDto, user: AuthUser) {
        
        if (dto.toOrgId === user.org.id) throw new BadRequestException('Cannot Transfer To Your Own Organization');
        
        const senderOrg = await this.prismaService.organization.findUnique({
            where: {
                id: user.org.id
            }
        })

        if (!senderOrg) throw new NotFoundException("Your Organization Not Found");

        if(senderOrg.status !== OrgStatus.LICENSED) throw new BadRequestException('Your Organization Is Not Licensed');

        if (!senderOrg.walletAddress) throw new ConflictException("Your Organization Has No Wallet Address");

        const recieverOrg = await this.prismaService.organization.findUnique({
            where: {
                id: dto.toOrgId
            }
        })

        if (!recieverOrg) throw new NotFoundException('Organization Not Found');

        if(recieverOrg.status !== OrgStatus.LICENSED) throw new BadRequestException('Reciever Organization Is Not Licensed');
        
        if (!recieverOrg.walletAddress) throw new ConflictException("Reciever Organization Has No Wallet Address");

        const nextHop: Partial<Record<OrgType, OrgType>> = {
            [OrgType.MANUFACTURER]: OrgType.DISTRIBUTOR,
            [OrgType.DISTRIBUTOR]: OrgType.PHARMACY,
        };

        if (nextHop[senderOrg.type] !== recieverOrg.type) {
            throw new BadRequestException(`${senderOrg.type} cannot transfer to ${recieverOrg.type}`);
        };

        const batch = await this.prismaService.batch.findUnique({
            where: {
                batchId: dto.batchId
            }
        })

        if (!batch) throw new NotFoundException("Batch Not Found");

        if (batch.recalled) throw new BadRequestException("Batch Is Expired");

        if (batch.expiryDate <= new Date()) throw new BadRequestException("Batch Is Expired");

        const held = await this.chainService.holdingOf(dto.batchId, senderOrg.walletAddress);

        if (held < dto.quantity) throw new BadRequestException(`Only ${held} units held`);

        const receipt = await this.chainWWriter.transferCustody(
            senderOrg.walletIndex,
            dto.batchId,
            recieverOrg.walletAddress,
            dto.quantity
        )

        if (!receipt) throw new BadRequestException("Reciept Not Created");

        this.logger.log(`Receipt Created For Batch ${batch.drugName}: ${receipt}`)

        const event = await this.prismaService.custodyEvent.create({
            data:{
                batchId: dto.batchId,
                fromOrgId: senderOrg.id,
                toOrgId: recieverOrg.id,
                quantity: dto.quantity,
                txHash: receipt.hash,
                blockNumber: BigInt(receipt.blockNumber),
                occurredAt: new Date()
            }
        })

        if (!event) throw new BadRequestException("Event Not Created");

        this.logger.log(`Custody Event Creted For Batch ${batch.drugName}: ${event}`)

        return {
            message: "Custody Transferred Successfully",
            data: {
                ...event,
                blockNumber: event.blockNumber.toString(),
                remaining: held - dto.quantity
            }
        };
    }

    async getBatchHistory(batchId: string) {

        const batch = await this.prismaService.batch.findUnique({
            where:{
                batchId: batchId
            }
        })

        if (!batch) throw new NotFoundException("Batch Not Found");

        const events = await this.prismaService.custodyEvent.findMany({
            where:{
                batchId: batchId
            },
            include: {
                fromOrg: {
                    select: {
                        id: true,
                        name: true,
                        type: true
                    }
                },
                toOrg: {
                    select: {
                        id: true,
                        name: true,
                        type: true
                    }
                }
            }
        });

        return {
            message: "Custody Events Fetched Successfully",
            events: events.map((e) => ({
                ...e,
                blockNumber: e.blockNumber.toString(),
            }))
        }
    }

    async sellUnit(dto: SellUnitDto, user: AuthUser) {

        const batch = await this.prismaService.batch.findUnique({
            where: {
                batchId: dto.batchId
            }
        })

        if (!batch) throw new NotFoundException("Batch Not Found");

        if (batch.recalled) throw new BadRequestException("Batch Is Expired");

        if (batch.expiryDate <= new Date()) throw new BadRequestException("Batch Is Expired");
        const pharmacy = await this.prismaService.organization.findUnique({
            where: {
                id: user.org.id
            }
        })

        if (!pharmacy) throw new NotFoundException("Your Organization Not Found");

        if (pharmacy.status !== OrgStatus.LICENSED) throw new BadRequestException("Your Organization Is Not Licensed");

        if (!pharmacy.walletAddress) throw new ConflictException("Your Organization Has No Wallet Address");

        const unitHash = toUnitHash(dto.batchId, dto.code.toUpperCase());
        
        const unit = await this.prismaService.unit.findUnique({
            where: {
                unitHash: unitHash
            },
            include: {
                batch: true
            }
        })

        if (!unit) throw new NotFoundException("Unit Not Found");

        if (unit.status === UnitStatus.SOLD) throw new ConflictException("Unit Already Sold");

        if (unit.batch.recalled) throw new BadRequestException("Unit Is Expired");

        const held = await this.chainService.holdingOf(dto.batchId, pharmacy.walletAddress)

        if (held === 0) throw new BadRequestException("Your Organization Hold No Unit Of This Batch");

        const txHash = await this.chainWWriter.markSold(
            pharmacy.walletIndex,
            dto.batchId,
            unitHash,
            unit.merkleProof as string[]
        )

        if (!txHash) throw new BadRequestException("Mark Sold On Chained");

        this.logger.log(`Mark Sold For Batch ${batch.drugName}: ${txHash}`)

        const soldUnit = await this.prismaService.unit.update({
            where: {
                unitHash: unitHash
            },
            data: {
                status: UnitStatus.SOLD,
                soldAt: new Date(),
                currentHolderId: pharmacy.id
            }
        })

        if (!soldUnit) throw new ConflictException("Unit Not Updated");

        return {
            message: "Unit Sold Successfully",
            data: {
                unitHash: unitHash,
                txHash: txHash,
                soldAt: soldUnit.soldAt,
                remaining: held - 1
            }
        }
    }

    async getHoldings(user: AuthUser) {
        const organization = await this.prismaService.organization.findUnique({
            where: {
                id: user.org.id
            }
        })

        if (!organization) throw new NotFoundException("Your Organization Not Found");

        if (!organization.walletAddress) throw new BadRequestException("Organization Has No Wallet Address");

        const batches = await this.prismaService.batch.findMany({
            where: {
                OR: [
                    {
                        manufacturerId: organization.id
                    },
                    {
                        custodyEvents: {
                            some: {
                                toOrgId: organization.id
                            }
                        }
                    }
                ]
            },
            select: {
                batchId: true,
                batchNumber: true,
                drugName: true,
                expiryDate: true
            }
        })

        const data = await Promise.all(
            batches.map(async (b) => ({
                ...b,
                held: await this.chainService.holdingOf(b.batchId, organization.walletAddress!)
            }))
        )

        return {
            message: "Holdings Fetched Successfully",
            data: data.filter((b) => b.held > 0)
        }
    }
}
