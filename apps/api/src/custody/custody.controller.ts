import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CustodyService } from './custody.service';
import { SellUnitDto, TransferCustodyDto } from './dto/custody.dto';
import { CurrentUser, OrgTypes } from 'src/auth/decorator/decorators';
import { type AuthUser } from 'src/auth/types/auth-user';
import { OrgType } from 'src/generated/prisma/enums';

@Controller('custody')
export class CustodyController {
  constructor(private readonly custodyService: CustodyService) {}

  @OrgTypes(OrgType.MANUFACTURER, OrgType.DISTRIBUTOR)
  @Post('transfer')
  async transfer(@Body() dto: TransferCustodyDto, @CurrentUser() user: AuthUser) {
    return this.custodyService.transfer(dto, user)
  }

  @OrgTypes(OrgType.REGULATOR, OrgType.DISTRIBUTOR, OrgType.MANUFACTURER, OrgType.PHARMACY)
  @Get('batch/:batchId')
  async history(@Param('batchId') batchId: string) {
    return this.custodyService.getBatchHistory(batchId)
  }

  @OrgTypes(OrgType.PHARMACY)
  @Post('sell')
  async sell(@Body() dto: SellUnitDto, @CurrentUser() user: AuthUser){
    return this.custodyService.sellUnit(dto, user)
  }

  @OrgTypes(OrgType.DISTRIBUTOR, OrgType.MANUFACTURER, OrgType.PHARMACY)
  @Get('custody/holdings')
  async holdings(@CurrentUser() user: AuthUser) {
    return this.custodyService.getHoldings(user)
  }
}