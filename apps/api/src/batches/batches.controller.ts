import { Body, Controller, Get, Param, Post, Query, Req, StreamableFile } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { CreateBatchDto } from './dto/batch.dto';
import { OrgType } from 'src/generated/prisma/enums';
import { CurrentUser, OrgTypes, Public } from 'src/auth/decorator/decorators';
import type { AuthUser } from 'src/auth/types/auth-user';
import type { Request } from 'express';
import { ScanLocationDto } from './dto/scan-location.dto';
import { ApiProduces } from '@nestjs/swagger';

@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @OrgTypes(OrgType.MANUFACTURER)
  @Post('create')
  async createBatch(@Body() batchData: CreateBatchDto, @CurrentUser() user: AuthUser) {
    return this.batchesService.createBatch(batchData, user.org.id);
  }

  @OrgTypes(OrgType.REGULATOR, OrgType.MANUFACTURER)
  @Get('all')
  async getAllBatches(@CurrentUser() user: AuthUser){
    return this.batchesService.getAllBatches(user);
  }

  @OrgTypes(OrgType.REGULATOR, OrgType.MANUFACTURER, OrgType.DISTRIBUTOR, OrgType.PHARMACY)
  @Get(':batchId')
  async getBatchById(@Param('batchId') batchId: string, @CurrentUser() user: AuthUser) {
    return this.batchesService.getBatchById(batchId, user);
  }

  @Public()
  @Get('verify/:batchId/:code')
  async verifyUnit(
    @Param('batchId') batchId: string, 
    @Param('code') code: string,
    @Query() query: ScanLocationDto,
    @Req() req: Request
  ) {
    const ctx = {
      ip: req.ip ?? 'unknown',
      deviceId: req.get('x-device-id') ?? req.get('user-agent') ?? 'unknown',
      ...query
    };    
    return this.batchesService.verifyUnit(batchId, code, ctx);
  }

  @OrgTypes(OrgType.MANUFACTURER)
  @ApiProduces('application/pdf')
  @Get(':batchId/labels')
  async getLabels(@Param('batchId') batchId: string, @CurrentUser() user: AuthUser) {
    const pdf = await this.batchesService.getLabels(batchId, user.org.id)
    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: `attachment; filename="labels-${batchId.slice(2, 10)}.pdf"`,
    })
  }
}
