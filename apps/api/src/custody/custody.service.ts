import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransferCustodyDto } from './dto/custody.dto';
import { type AuthUser } from 'src/auth/types/auth-user';
import { OrgStatus, OrgType } from 'src/generated/prisma/enums';
import { ChainWriterService } from 'src/chain/chain-writer.service';
import { ChainService } from 'src/chain/chain.service';

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
}
