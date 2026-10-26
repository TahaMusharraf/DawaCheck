import { Module } from '@nestjs/common';
import { ChainModule } from 'src/chain/chain.module';
import { BatchesService } from './batches.service';
import { BatchesController } from './batches.controller';
import { CloneDetectionModule } from 'src/clone-detection/clone-detection.module';
import { QrModule } from 'src/qr/qr.module';

@Module({
  imports: [ChainModule, CloneDetectionModule, QrModule],
  controllers: [BatchesController],
  providers: [BatchesService],
})
export class BatchesModule {}
