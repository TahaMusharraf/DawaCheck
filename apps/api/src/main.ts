import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { corsOrigins, type Env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Env, true>);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: corsOrigins(config.get('CORS_ORIGINS', { infer: true })),
    credentials: true,
  });

  const docsConfig = new DocumentBuilder()
    .setTitle('DawaCheck API')
    .setDescription(
      'Blockchain-backed medicine authenticity. Verification is public; ' +
        'everything an organisation does needs a logged-in role.',
    )
    .setVersion('0.1')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .addTag('health', 'Liveness and readiness probes')
    .addTag('chain', 'Read-only window onto the MedicineRegistry contract')
    .build();

  SwaggerModule.setup('api/swagger', app, SwaggerModule.createDocument(app, docsConfig), {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  Logger.log(`API listening on http://localhost:${port}/api`, 'Bootstrap');
  Logger.log(`API docs on http://localhost:${port}/api/swagger`, 'Bootstrap');
}

void bootstrap();
