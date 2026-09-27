import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ListOrgsQueryDto } from './dto/organization.dto';
import { OrgStatus, OrgType } from 'src/generated/prisma/browser';

@Injectable()
export class OrganizationService {
    constructor(private prismaService: PrismaService) {}

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

        if (organization.status !== OrgStatus.PENDING) {
            throw new ConflictException("Only Pending Organizations Can Be Approved")
        }

        const updatedOrg = await this.prismaService.organization.update({
            where:{
                id: orgId
            },
            data:{
                status: OrgStatus.LICENSED
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

        const updatedOrg = await this.prismaService.organization.update({
            where:{
                id: orgId
            },
            data:{
                status: OrgStatus.REVOKED
            }
        })

        return updatedOrg;
    }
}
