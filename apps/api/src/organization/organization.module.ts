import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { ChainModule } from 'src/chain/chain.module';

@Module({
  controllers: [OrganizationController],
  providers: [OrganizationService],
  imports: [ChainModule],
})
export class OrganizationModule {}
