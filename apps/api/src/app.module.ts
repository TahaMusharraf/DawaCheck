import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChainModule } from './chain/chain.module';
import { validateEnv } from './config/env';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

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
  ],
})
export class AppModule {}
