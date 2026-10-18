import { Module } from '@nestjs/common';
import { CustodyService } from './custody.service';
import { CustodyController } from './custody.controller';
import { ChainModule } from 'src/chain/chain.module';

@Module({
  controllers: [CustodyController],
  providers: [CustodyService],
  imports: [ChainModule],
})
export class CustodyModule {}
