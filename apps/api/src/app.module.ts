import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChainModule } from './chain/chain.module';
import { validateEnv } from './config/env';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationModule } from './organization/organization.module';
import { BatchesModule } from './batches/batches.module';
import { CustodyModule } from './custody/custody.module';
import { RecallsModule } from './recalls/recalls.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    PrismaModule,
    ChainModule,
    HealthModule,
    AuthModule,
    OrganizationModule,
    BatchesModule,
    CustodyModule,
    RecallsModule,
  ],
})
export class AppModule {}
