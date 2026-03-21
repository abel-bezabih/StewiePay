"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var IntegrationReadinessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationReadinessService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let IntegrationReadinessService = IntegrationReadinessService_1 = class IntegrationReadinessService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(IntegrationReadinessService_1.name);
    }
    onModuleInit() {
        const report = this.getReadinessReport();
        const strict = (process.env.STRICT_INTEGRATION_CONFIG ??
            (process.env.NODE_ENV === 'production' ? 'true' : 'false')) === 'true';
        if (strict && !report.ready) {
            throw new Error(`Integration configuration invalid: ${report.issues
                .map((i) => `${i.key}: ${i.message}`)
                .join('; ')}`);
        }
        if (!report.ready) {
            this.logger.warn(`Integration readiness warnings: ${report.issues
                .map((i) => `${i.key}: ${i.message}`)
                .join('; ')}`);
        }
    }
    getReadinessReport() {
        const issues = [];
        const issuerProvider = this.config.get('ISSUER_PROVIDER') || 'dummy';
        const pspProvider = this.config.get('PSP_PROVIDER') || 'dummy';
        const isProd = (process.env.NODE_ENV || 'development') === 'production';
        const valueLooksPlaceholder = (value) => {
            if (!value)
                return true;
            const normalized = value.trim().toLowerCase();
            if (!normalized)
                return true;
            const tokens = [
                'changeme',
                'change-me',
                'dev-secret',
                'example',
                'your-',
                'dummy',
                'test-',
                'sample'
            ];
            return tokens.some((token) => normalized.includes(token));
        };
        const looksWeakSecret = (value) => {
            if (!value)
                return true;
            const trimmed = value.trim();
            return trimmed.length < 32 || valueLooksPlaceholder(trimmed);
        };
        const required = (key, reason) => {
            if (!this.config.get(key)) {
                issues.push({ key, message: reason });
            }
        };
        if (issuerProvider === 'http') {
            required('ISSUER_BASE_URL', 'required when ISSUER_PROVIDER=http');
            required('ISSUER_API_KEY', 'required when ISSUER_PROVIDER=http');
            required('ISSUER_WEBHOOK_SECRET', 'required for issuer webhook verification');
            if (isProd && valueLooksPlaceholder(this.config.get('ISSUER_API_KEY'))) {
                issues.push({ key: 'ISSUER_API_KEY', message: 'must be a real non-placeholder key in production' });
            }
            if (isProd && looksWeakSecret(this.config.get('ISSUER_WEBHOOK_SECRET'))) {
                issues.push({ key: 'ISSUER_WEBHOOK_SECRET', message: 'must be a strong non-placeholder secret in production' });
            }
        }
        else if (isProd && issuerProvider === 'dummy') {
            issues.push({ key: 'ISSUER_PROVIDER', message: 'dummy issuer cannot be used in production' });
        }
        if (pspProvider === 'http') {
            required('PSP_BASE_URL', 'required when PSP_PROVIDER=http');
            required('PSP_API_KEY', 'required when PSP_PROVIDER=http');
            required('PSP_WEBHOOK_SECRET', 'required for PSP webhook verification');
            if (isProd && valueLooksPlaceholder(this.config.get('PSP_API_KEY'))) {
                issues.push({ key: 'PSP_API_KEY', message: 'must be a real non-placeholder key in production' });
            }
            if (isProd && looksWeakSecret(this.config.get('PSP_WEBHOOK_SECRET'))) {
                issues.push({ key: 'PSP_WEBHOOK_SECRET', message: 'must be a strong non-placeholder secret in production' });
            }
        }
        else if (pspProvider === 'chapa') {
            required('PSP_API_KEY', 'required when PSP_PROVIDER=chapa');
            required('CHAPA_WEBHOOK_SECRET', 'required for Chapa webhook verification');
            required('CHAPA_CALLBACK_URL', 'required for Chapa callback flow');
            if (isProd && valueLooksPlaceholder(this.config.get('PSP_API_KEY'))) {
                issues.push({ key: 'PSP_API_KEY', message: 'must be a real non-placeholder Chapa secret key in production' });
            }
            if (isProd && looksWeakSecret(this.config.get('CHAPA_WEBHOOK_SECRET'))) {
                issues.push({ key: 'CHAPA_WEBHOOK_SECRET', message: 'must be a strong non-placeholder secret in production' });
            }
        }
        else if (isProd && pspProvider === 'dummy') {
            issues.push({ key: 'PSP_PROVIDER', message: 'dummy PSP cannot be used in production' });
        }
        const jwtSecret = this.config.get('JWT_SECRET');
        if (!jwtSecret) {
            issues.push({ key: 'JWT_SECRET', message: 'required for token signing' });
        }
        else if (isProd && looksWeakSecret(jwtSecret)) {
            issues.push({ key: 'JWT_SECRET', message: 'must be at least 32 chars and not a placeholder in production' });
        }
        const backendPublicUrl = this.config.get('BACKEND_PUBLIC_URL');
        if (isProd && !backendPublicUrl) {
            issues.push({ key: 'BACKEND_PUBLIC_URL', message: 'required in production for email links and callbacks' });
        }
        const corsAllowlist = this.config.get('CORS_ORIGIN_ALLOWLIST');
        if (isProd && !corsAllowlist) {
            issues.push({ key: 'CORS_ORIGIN_ALLOWLIST', message: 'required in production to restrict cross-origin access' });
        }
        return {
            ready: issues.length === 0,
            issuerProvider,
            pspProvider,
            issues
        };
    }
};
exports.IntegrationReadinessService = IntegrationReadinessService;
exports.IntegrationReadinessService = IntegrationReadinessService = IntegrationReadinessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], IntegrationReadinessService);
//# sourceMappingURL=integration-readiness.service.js.map