import { Module } from '@nestjs/common';
import { ChainModule } from 'src/chain/chain.module';
import { BatchesService } from './batches.service';
import { BatchesController } from './batches.controller';

@Module({
  imports: [ChainModule],
  controllers: [BatchesController],
  providers: [BatchesService],
})
export class BatchesModule {}
