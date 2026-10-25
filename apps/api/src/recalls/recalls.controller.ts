import { Body, Controller, Get, Post } from '@nestjs/common';
import { RecallsService } from './recalls.service';
import { CurrentUser, OrgTypes } from 'src/auth/decorator/decorators';
import { OrgType } from 'src/generated/prisma/enums';
import { RecallDto } from './dto/recall.dto';
import { type AuthUser } from 'src/auth/types/auth-user';

@Controller('recalls')
export class RecallsController {
  constructor(private readonly recallsService: RecallsService) {}

  @OrgTypes(OrgType.REGULATOR, OrgType.MANUFACTURER)
  @Post()
  async recall(@Body() dto: RecallDto, @CurrentUser() user: AuthUser) {
    return this.recallsService.recallBatch(dto, user)
  }

  @OrgTypes(OrgType.REGULATOR, OrgType.MANUFACTURER, OrgType.DISTRIBUTOR, OrgType.PHARMACY)
  @Get()
  async listRecalls(@CurrentUser() user: AuthUser) {
    return this.recallsService.listRecalls(user)
  }
}
