import { Module } from '@nestjs/common';
import { ChainWriterService } from './chain-writer.service';
import { ChainController } from './chain.controller';
import { ChainService } from './chain.service';

@Module({
  controllers: [ChainController],
  providers: [ChainService, ChainWriterService],
  exports: [ChainService, ChainWriterService],
})
export class ChainModule {}
