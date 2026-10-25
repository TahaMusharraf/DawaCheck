import { Module } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { ChainModule } from 'src/chain/chain.module';

@Module({
  providers: [IndexerService],
  imports: [ChainModule]
})
export class IndexerModule {}
