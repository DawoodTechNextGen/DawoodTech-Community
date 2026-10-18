import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module.js';
import { CorsIoAdapter } from './common/cors-io.adapter.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  const corsOrigins = config.get<string[]>('corsOrigins') ?? [];
  app.enableCors({ origin: corsOrigins, credentials: true });
  app.useWebSocketAdapter(new CorsIoAdapter(app, corsOrigins));
  // Behind cPanel's proxy every request comes from the proxy; trusting it
  // gives rate limits the visitor's real IP (X-Forwarded-For).
  app.set('trust proxy', config.get<number>('trustProxy') ?? 1);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
    // Never let a browser guess a stored file is HTML or script.
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  });

  await app.listen(config.get<number>('port') ?? 3000);
}

// No top-level await: some hosts (cPanel's LiteSpeed lsnode.js launcher)
// load the entry file with require(), which Node refuses for an ESM
// module that has top-level await.
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
