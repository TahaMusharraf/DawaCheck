import { Module } from '@nestjs/common';
import { CloneDetectionService } from './clone-detection.service';
import { CloneDetectionController } from './clone-detection.controller';

@Module({
  controllers: [CloneDetectionController],
  providers: [CloneDetectionService],
  exports: [CloneDetectionService]
})
export class CloneDetectionModule {}
