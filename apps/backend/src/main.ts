import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { json, urlencoded } from 'express';
import * as Sentry from '@sentry/node';

function parseOriginList(value?: string) {
  return new Set(
    (value || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  );
}

function isAllowedBySuffix(origin: string, suffixes: string[]) {
  try {
    const host = new URL(origin).hostname;
    return suffixes.some((suffix) => host.endsWith(suffix));
  } catch {
    return false;
  }
}

async function bootstrap() {
  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1)
    });
  }

  const app = await NestFactory.create(AppModule);
  
  // Increase body size limit for image uploads (10MB should be enough for base64 images)
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));
  
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  if (sentryDsn) {
    const expressApp = app.getHttpAdapter().getInstance();
    Sentry.setupExpressErrorHandler(expressApp);
  }

  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8081',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:8081'
  ];
  const allowlist = parseOriginList(process.env.CORS_ORIGIN_ALLOWLIST);
  if (!allowlist.size) {
    defaultOrigins.forEach((origin) => allowlist.add(origin));
    const backendPublicUrl = process.env.BACKEND_PUBLIC_URL?.trim();
    if (backendPublicUrl) allowlist.add(backendPublicUrl);
  }

  const allowNgrok = (process.env.CORS_ALLOW_NGROK ?? 'true') === 'true';
  const allowNgrokSuffixes = (process.env.CORS_NGROK_SUFFIXES ?? '.ngrok-free.app,.ngrok-free.dev')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowlist.has(origin)) return callback(null, true);
      if (allowNgrok && isAllowedBySuffix(origin, allowNgrokSuffixes)) {
        return callback(null, true);
      }
      // Do not throw for disallowed origins; simply omit CORS headers.
      // Browser clients from blocked origins will be rejected by CORS policy without a server 500.
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  // Lightweight in-memory rate limit (per IP per minute)
  const hits = new Map<string, { count: number; resetAt: number }>();
  app.use((req: any, res: any, next: any) => {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000;
    const max = 120;
    const current = hits.get(key);
    if (!current || current.resetAt < now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (current.count >= max) {
      res.status(429).json({ statusCode: 429, message: 'Too many requests' });
      return;
    }
    current.count += 1;
    hits.set(key, current);
    next();
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  // Use 0.0.0.0 to accept connections from all interfaces (localhost, 127.0.0.1, and Mac IP)
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  // Simple log to confirm the placeholder server would run once dependencies are installed.
  // eslint-disable-next-line no-console
  console.log(`Backend placeholder ready at http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/api/health`);
}

bootstrap();


