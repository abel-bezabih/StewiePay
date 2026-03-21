import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type ReadinessIssue = {
  key: string;
  message: string;
};

@Injectable()
export class IntegrationReadinessService implements OnModuleInit {
  private readonly logger = new Logger(IntegrationReadinessService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const report = this.getReadinessReport();
    const strict =
      (process.env.STRICT_INTEGRATION_CONFIG ??
        (process.env.NODE_ENV === 'production' ? 'true' : 'false')) === 'true';
    if (strict && !report.ready) {
      throw new Error(
        `Integration configuration invalid: ${report.issues
          .map((i) => `${i.key}: ${i.message}`)
          .join('; ')}`
      );
    }
    if (!report.ready) {
      this.logger.warn(
        `Integration readiness warnings: ${report.issues
          .map((i) => `${i.key}: ${i.message}`)
          .join('; ')}`
      );
    }
  }

  getReadinessReport() {
    const issues: ReadinessIssue[] = [];
    const issuerProvider = this.config.get<string>('ISSUER_PROVIDER') || 'dummy';
    const pspProvider = this.config.get<string>('PSP_PROVIDER') || 'dummy';
    const isProd = (process.env.NODE_ENV || 'development') === 'production';

    const valueLooksPlaceholder = (value?: string) => {
      if (!value) return true;
      const normalized = value.trim().toLowerCase();
      if (!normalized) return true;
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

    const looksWeakSecret = (value?: string) => {
      if (!value) return true;
      const trimmed = value.trim();
      return trimmed.length < 32 || valueLooksPlaceholder(trimmed);
    };

    const required = (key: string, reason: string) => {
      if (!this.config.get<string>(key)) {
        issues.push({ key, message: reason });
      }
    };

    if (issuerProvider === 'http') {
      required('ISSUER_BASE_URL', 'required when ISSUER_PROVIDER=http');
      required('ISSUER_API_KEY', 'required when ISSUER_PROVIDER=http');
      required('ISSUER_WEBHOOK_SECRET', 'required for issuer webhook verification');
      if (isProd && valueLooksPlaceholder(this.config.get<string>('ISSUER_API_KEY'))) {
        issues.push({ key: 'ISSUER_API_KEY', message: 'must be a real non-placeholder key in production' });
      }
      if (isProd && looksWeakSecret(this.config.get<string>('ISSUER_WEBHOOK_SECRET'))) {
        issues.push({ key: 'ISSUER_WEBHOOK_SECRET', message: 'must be a strong non-placeholder secret in production' });
      }
    } else if (isProd && issuerProvider === 'dummy') {
      issues.push({ key: 'ISSUER_PROVIDER', message: 'dummy issuer cannot be used in production' });
    }

    if (pspProvider === 'http') {
      required('PSP_BASE_URL', 'required when PSP_PROVIDER=http');
      required('PSP_API_KEY', 'required when PSP_PROVIDER=http');
      required('PSP_WEBHOOK_SECRET', 'required for PSP webhook verification');
      if (isProd && valueLooksPlaceholder(this.config.get<string>('PSP_API_KEY'))) {
        issues.push({ key: 'PSP_API_KEY', message: 'must be a real non-placeholder key in production' });
      }
      if (isProd && looksWeakSecret(this.config.get<string>('PSP_WEBHOOK_SECRET'))) {
        issues.push({ key: 'PSP_WEBHOOK_SECRET', message: 'must be a strong non-placeholder secret in production' });
      }
    } else if (pspProvider === 'chapa') {
      required('PSP_API_KEY', 'required when PSP_PROVIDER=chapa');
      required('CHAPA_WEBHOOK_SECRET', 'required for Chapa webhook verification');
      required('CHAPA_CALLBACK_URL', 'required for Chapa callback flow');
      if (isProd && valueLooksPlaceholder(this.config.get<string>('PSP_API_KEY'))) {
        issues.push({ key: 'PSP_API_KEY', message: 'must be a real non-placeholder Chapa secret key in production' });
      }
      if (isProd && looksWeakSecret(this.config.get<string>('CHAPA_WEBHOOK_SECRET'))) {
        issues.push({ key: 'CHAPA_WEBHOOK_SECRET', message: 'must be a strong non-placeholder secret in production' });
      }
    } else if (isProd && pspProvider === 'dummy') {
      issues.push({ key: 'PSP_PROVIDER', message: 'dummy PSP cannot be used in production' });
    }

    const jwtSecret = this.config.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      issues.push({ key: 'JWT_SECRET', message: 'required for token signing' });
    } else if (isProd && looksWeakSecret(jwtSecret)) {
      issues.push({ key: 'JWT_SECRET', message: 'must be at least 32 chars and not a placeholder in production' });
    }

    const backendPublicUrl = this.config.get<string>('BACKEND_PUBLIC_URL');
    if (isProd && !backendPublicUrl) {
      issues.push({ key: 'BACKEND_PUBLIC_URL', message: 'required in production for email links and callbacks' });
    }

    const corsAllowlist = this.config.get<string>('CORS_ORIGIN_ALLOWLIST');
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
}
