import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorator/decorators';
import { HealthResponse, ReadinessResponse } from './health.dto';
import { HealthService } from './health.service';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /** Render pings this to keep the service awake; keep it cheap. */
  @Get()
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'Cheap and dependency-free, so a sleeping service wakes fast.',
  })
  @ApiOkResponse({ type: HealthResponse })
  check(): HealthResponse {
    return this.health.check();
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness probe',
    description:
      'Runs SELECT 1 against PostgreSQL. Returns 200 with status "degraded" ' +
      'when the database is unreachable, rather than failing the request.',
  })
  @ApiOkResponse({ type: ReadinessResponse })
  ready(): Promise<ReadinessResponse> {
    return this.health.ready();
  }
}
