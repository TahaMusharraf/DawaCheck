import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { OrgTypes } from 'src/auth/decorator/decorators';
import { OrgType } from 'src/generated/prisma/enums';
import { ListAlertsDto, UpdateAlertsDto } from './dto/alerts.dto';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @OrgTypes(OrgType.REGULATOR)
  @Get()
  async listAlerts(@Query() query: ListAlertsDto) {
    return this.alertsService.listAlerts(query.status)
  }

  @OrgTypes(OrgType.REGULATOR)
  @Get(':id')
  async getAlert(@Param('id') id: string) {
    return this.alertsService.getAlert(id)
  }

  @OrgTypes(OrgType.REGULATOR)
  @Patch(':id')
  async updateAlert(@Param('id') id: string, @Body() dto: UpdateAlertsDto) {
    return this.alertsService.updateAlert(id, dto.status)
  }
}
