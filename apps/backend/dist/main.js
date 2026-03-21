"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const http_exception_filter_1 = require("./common/http-exception.filter");
const express_1 = require("express");
const Sentry = __importStar(require("@sentry/node"));
function parseOriginList(value) {
    return new Set((value || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean));
}
function isAllowedBySuffix(origin, suffixes) {
    try {
        const host = new URL(origin).hostname;
        return suffixes.some((suffix) => host.endsWith(suffix));
    }
    catch {
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
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    // Increase body size limit for image uploads (10MB should be enough for base64 images)
    app.use((0, express_1.json)({ limit: '10mb' }));
    app.use((0, express_1.urlencoded)({ limit: '10mb', extended: true }));
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
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
        if (backendPublicUrl)
            allowlist.add(backendPublicUrl);
    }
    const allowNgrok = (process.env.CORS_ALLOW_NGROK ?? 'true') === 'true';
    const allowNgrokSuffixes = (process.env.CORS_NGROK_SUFFIXES ?? '.ngrok-free.app,.ngrok-free.dev')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            if (allowlist.has(origin))
                return callback(null, true);
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
    const hits = new Map();
    app.use((req, res, next) => {
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
//# sourceMappingURL=main.js.map