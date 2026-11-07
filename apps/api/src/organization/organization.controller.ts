import { Controller, Get, Param, Put, Query } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CurrentUser, OrgTypes } from 'src/auth/decorator/decorators';
import { ListOrgsQueryDto } from './dto/organization.dto';
import type { AuthUser } from 'src/auth/types/auth-user';

@OrgTypes('REGULATOR')
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  // pass no query to get all organizations
  @Get('getOrganization')
  async getOrganization(@Query() query: ListOrgsQueryDto) {
    return this.organizationService.getOrganization(query);
  }

  // Declared before ':orgId' so "partners" isn't read as an id.
  @OrgTypes('MANUFACTURER', 'DISTRIBUTOR')
  @Get('partners')
  async getPartners(@CurrentUser() user: AuthUser) {
    return this.organizationService.getPartners(user);
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
