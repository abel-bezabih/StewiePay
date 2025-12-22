"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const http_exception_filter_1 = require("./common/http-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.enableCors({
        origin: '*',
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