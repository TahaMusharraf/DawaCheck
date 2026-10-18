import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { CreateBatchDto } from './dto/batch.dto';
import { OrgType } from 'src/generated/prisma/enums';
import { CurrentUser, OrgTypes, Public } from 'src/auth/decorator/decorators';
import type { AuthUser } from 'src/auth/types/auth-user';

@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @OrgTypes(OrgType.MANUFACTURER)
  @Post('create')
  async createBatch(@Body() batchData: CreateBatchDto, @CurrentUser() user: AuthUser) {
    return this.batchesService.createBatch(batchData, user.org.id);
  }

  @OrgTypes(OrgType.REGULATOR)
  @Get('all')
  async getAllBatches(){
    return this.batchesService.getAllBatches();
  }

  @OrgTypes(OrgType.REGULATOR, OrgType.MANUFACTURER, OrgType.DISTRIBUTOR, OrgType.PHARMACY)
  @Get(':batchId')
  async getBatchById(@Param('batchId') batchId: string, @CurrentUser() user: AuthUser) {
    return this.batchesService.getBatchById(batchId, user);
  }

  @Public()
  @Get('verify/:batchId/:code')
  async verifyUnit(@Param('batchId') batchId: string, @Param('code') code: string) {
    return this.batchesService.verifyUnit(batchId, code);
  }
}
