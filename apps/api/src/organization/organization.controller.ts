import { Controller, Get, Param, Put, Query } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrgTypes } from 'src/auth/decorator/decorators';
import { ListOrgsQueryDto } from './dto/organization.dto';

@OrgTypes('REGULATOR')
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  // pass no query to get all organizations
  @Get('getOrganization')
  async getOrganization(@Query() query: ListOrgsQueryDto) {
    return this.organizationService.getOrganization(query);
  }

  @Get(':orgId')
  async getOrganizationById(@Param('orgId') orgId: string){
    return this.organizationService.getOrganizationById(orgId);
  }

  @Put('approveOrganization/:orgId')
  async approveOrganization(@Param('orgId') orgId: string) {
    return this.organizationService.approveOrganization(orgId);
  }

  @Put('revokeOrganization/:orgId')
  async revokeOrganization(@Param('orgId') orgId: string) {
    return this.organizationService.revokeOrganization(orgId);
  }
}
