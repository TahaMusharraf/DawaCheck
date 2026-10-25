import { Module } from '@nestjs/common';
import { CloneDetectionService } from './clone-detection.service';

@Module({
  providers: [CloneDetectionService],
  exports: [CloneDetectionService]
})
export class CloneDetectionModule {}
