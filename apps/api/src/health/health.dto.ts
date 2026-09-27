import { ApiProperty } from '@nestjs/swagger';

export class HealthResponse {
  @ApiProperty({ example: 'ok' })
  status!: 'ok';

  @ApiProperty({ description: 'Seconds since the process started', example: 42 })
  uptime!: number;

  @ApiProperty({ description: 'Chain the API is configured for', example: 80002 })
  chainId!: number;

  @ApiProperty({
    nullable: true,
    description: 'Deployed MedicineRegistry, or null if not configured yet',
    example: '0xD95A8B612971667888beB641e79Ad84D481367DA',
  })
  registryAddress!: string | null;

  @ApiProperty({ example: '2026-09-22T16:00:00.000Z' })
  timestamp!: string;
}

export class ReadinessResponse {
  @ApiProperty({ enum: ['ok', 'degraded'], example: 'ok' })
  status!: 'ok' | 'degraded';

  @ApiProperty({ enum: ['up', 'down'], example: 'up' })
  database!: 'up' | 'down';
}
