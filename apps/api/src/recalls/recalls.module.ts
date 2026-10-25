import { Module } from '@nestjs/common';
import { RecallsService } from './recalls.service';
import { RecallsController } from './recalls.controller';
import { ChainModule } from 'src/chain/chain.module';

@Module({
  controllers: [RecallsController],
  providers: [RecallsService],
  imports: [ChainModule]
})
export class RecallsModule {}
