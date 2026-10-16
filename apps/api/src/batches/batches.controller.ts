import { Body, Controller, Post } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { CreateBatchDto } from './dto/batch.dto';
import { OrgType } from 'src/generated/prisma/enums';
import { CurrentUser, OrgTypes } from 'src/auth/decorator/decorators';
import type { AuthUser } from 'src/auth/types/auth-user';

@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @OrgTypes(OrgType.MANUFACTURER)
  @Post('create')
  async createBatch(@Body() batchData: CreateBatchDto, @CurrentUser() user: AuthUser) {
    return this.batchesService.createBatch(batchData, user.org.id);
  }
}
