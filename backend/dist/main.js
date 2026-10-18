import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { join } from 'node:path';
import { AppModule } from './app.module.js';
import { CorsIoAdapter } from './common/cors-io.adapter.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);
    const corsOrigins = config.get('corsOrigins') ?? [];
    app.enableCors({ origin: corsOrigins, credentials: true });
    app.useWebSocketAdapter(new CorsIoAdapter(app, corsOrigins));
    app.set('trust proxy', config.get('trustProxy') ?? 1);
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useStaticAssets(join(process.cwd(), 'uploads'), {
        prefix: '/uploads',
        setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
    });
    await app.listen(config.get('port') ?? 3000);
}
bootstrap().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map