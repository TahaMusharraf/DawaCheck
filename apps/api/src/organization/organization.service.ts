import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ListOrgsQueryDto } from './dto/organization.dto';
import { OrgStatus, OrgType } from 'src/generated/prisma/browser';
import { ChainWriterService } from 'src/chain/chain-writer.service';

@Injectable()
export class OrganizationService {
    private readonly logger = new Logger(OrganizationService.name);

    constructor(
        private prismaService: PrismaService,
        private chainWriter: ChainWriterService,
    ) {}

    async getOrganization(query: ListOrgsQueryDto) {
        const organization = await this.prismaService.organization.findMany({
            where: {
                name: query.orgName ? { contains: query.orgName, mode: 'insensitive' } : undefined,
                type: query.orgType,
                city: query.city ? { contains: query.city, mode: 'insensitive' } : undefined,
                status: query.status
            },
        });
        return organization;
    }

    async getOrganizationById(orgId: any){
        const organization =  await this.prismaService.organization.findUnique({
            where:{
                id: orgId
            }
        })

        if (!organization) throw new NotFoundException("Organization Not Found")

        return organization;
    }

    async approveOrganization(orgId: string) {
        const organization = await this.prismaService.organization.findUnique({
            where: {
                id: orgId, 
            }
        });

        if (!organization) throw new NotFoundException("Organization Not Found")

        if (organization.type === OrgType.REGULATOR) {
            throw new ForbiddenException("You Cannot Approve The Regulator")
        }

        if (organization.status !== OrgStatus.PENDING) {
            throw new ConflictException("Only Pending Organizations Can Be Approved")
        }

        const wallet = this.chainWriter.orgWallet(organization.walletIndex);
        const hash = await this.chainWriter.licenseParty(wallet.address, organization.type, organization.licenseNo);

        this.logger.log(`Organization ${organization.name} approved on-chain with tx hash: ${hash}`);

        try {
            await this.chainWriter.fundWallet(wallet.address);
        } catch (error) {
            this.logger.warn(`Could not fund wallet ${wallet.address}: ${(error as Error).message}`);
        }

        const updatedOrg = await this.prismaService.organization.update({
            where:{
                id: orgId,
                status: OrgStatus.PENDING
            },
            data:{
                status: OrgStatus.LICENSED,
                licenseTxHash: hash,
                walletAddress: wallet.address
            }
        })
        
        return updatedOrg;
    }

    async revokeOrganization(orgId: string) {
        const organization = await this.prismaService.organization.findUnique({
            where: { id: orgId }
        });

        if (!organization) throw new NotFoundException("Organization Not Found")

        if (organization.type === OrgType.REGULATOR) {
            throw new ForbiddenException("You Cannot Revoke The Regulator")
        }

        if (organization.status !== OrgStatus.LICENSED){
            throw new ConflictException("Only Licensed Organization Can Be Revoked")
        }

        if(!organization.walletAddress){
            throw new ConflictException("Organization does not have a wallet address to revoke")
        }

        const hash = await this.chainWriter.revokeParty(organization.walletAddress, organization.type);

        this.logger.log(`Organization ${organization.name} revoked on-chain with tx hash: ${hash}`);

        const updatedOrg = await this.prismaService.organization.update({
            where:{
                id: orgId,
                status: OrgStatus.LICENSED
            },
            data:{
                status: OrgStatus.REVOKED
            }
        })

        return updatedOrg;
    }
}
