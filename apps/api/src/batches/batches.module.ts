import { Module } from '@nestjs/common';
import { ChainModule } from 'src/chain/chain.module';
import { BatchesService } from './batches.service';
import { BatchesController } from './batches.controller';
import { CloneDetectionService } from 'src/clone-detection/clone-detection.service';
import { CloneDetectionModule } from 'src/clone-detection/clone-detection.module';

@Module({
  imports: [ChainModule, CloneDetectionModule],
  controllers: [BatchesController],
  providers: [BatchesService],
})
export class BatchesModule {}
