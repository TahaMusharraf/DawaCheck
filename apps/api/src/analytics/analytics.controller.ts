import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { OrgTypes } from 'src/auth/decorator/decorators';
import { DaysQueryDto } from './dto/analytics.dto';
import { OrgType } from 'src/generated/prisma/browser';

@OrgTypes(OrgType.REGULATOR)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  async overview() {
    return this.analyticsService.overview();
  }

  @Get('heatmap')
  async heatmap(@Query('days') query: DaysQueryDto) {
    return this.analyticsService.heatmap(query.days ?? 30);
  }
}
