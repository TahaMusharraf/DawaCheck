import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /** Render pings this to keep the service awake; keep it cheap. */
  @Get()
  check() {
    return this.health.check();
  }

  @Get('ready')
  ready() {
    return this.health.ready();
  }
}
