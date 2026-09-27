import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/decorator/decorators';
import { BatchResponse, ChainStatusResponse } from './dto/chain.dto';
import { ChainService } from './chain.service';

/**
 * Thin read-only window onto the contract, mainly for development and the demo.
 * The public scan flow gets its own verification endpoint later.
 */
@ApiTags('chain')
@Public()
@Controller('chain')
export class ChainController {
  constructor(private readonly chain: ChainService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Chain connection status',
    description: 'Confirms which chain and registry the API is wired to.',
  })
  @ApiOkResponse({ type: ChainStatusResponse })
  status(): Promise<ChainStatusResponse> {
    return this.chain.getChainStatus();
  }

  @Get('batch/:batchRef')
  @ApiOperation({
    summary: 'Read a batch from the contract',
    description: 'A free view call: no gas and no wallet needed.',
  })
  @ApiParam({
    name: 'batchRef',
    description: 'Batch number or 0x batchId',
    example: 'PAN-500-2026-001',
  })
  @ApiOkResponse({ type: BatchResponse })
  @ApiNotFoundResponse({ description: 'No batch registered under that id' })
  async batch(@Param('batchRef') batchRef: string): Promise<BatchResponse> {
    const batchId = batchRef.startsWith('0x')
      ? batchRef
      : this.chain.toBatchId(batchRef);

    const batch = await this.chain.getBatch(batchId);
    if (!batch) {
      throw new NotFoundException(`No batch registered for ${batchRef}`);
    }

    return { batchId, ...batch };
  }
}
