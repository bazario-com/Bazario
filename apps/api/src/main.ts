import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Trust the request logger provided by the platform; keep Nest's own
    // logs structured and quiet-by-default in production.
    logger: ['error', 'warn', 'log'],
  });

  const config = app.get(ConfigService);

  // --- Security headers (OWASP baseline) ------------------------------------
  app.use(helmet());
  app.use(cookieParser(config.get('COOKIE_SECRET')));

  // --- CORS ------------------------------------------------------------------
  app.enableCors({
    origin: config.get('CORS_ORIGIN')?.split(',') ?? true,
    credentials: true,
  });

  // --- Global validation: strips unknown fields, rejects invalid payloads ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // --- Global error shape ----------------------------------------------------
  app.useGlobalFilters(new HttpExceptionFilter());

  app.setGlobalPrefix('api/v1');

  const port = config.get('PORT') ?? 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}/api/v1`);
}

bootstrap();
