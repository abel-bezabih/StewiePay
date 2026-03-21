import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DummyIssuerAdapter } from './issuer/dummy-issuer.adapter';
import { DummyPspAdapter } from './psp/dummy-psp.adapter';
import { HttpIssuerAdapter } from './issuer/http-issuer.adapter';
import { HttpPspAdapter } from './psp/http-psp.adapter';
import { ChapaPspAdapter } from './psp/chapa-psp.adapter';
import { ISSUER_ADAPTER } from './issuer/issuer.adapter';
import { PSP_ADAPTER } from './psp/psp.adapter';
import { IntegrationReadinessService } from './integration-readiness.service';

@Module({
  providers: [
    DummyIssuerAdapter,
    DummyPspAdapter,
    HttpIssuerAdapter,
    HttpPspAdapter,
    ChapaPspAdapter,
    IntegrationReadinessService,
    {
      provide: ISSUER_ADAPTER,
      useFactory: (
        config: ConfigService,
        dummy: DummyIssuerAdapter,
        http: HttpIssuerAdapter
      ) => (config.get<string>('ISSUER_PROVIDER') === 'http' ? http : dummy),
      inject: [ConfigService, DummyIssuerAdapter, HttpIssuerAdapter]
    },
    {
      provide: PSP_ADAPTER,
      useFactory: (
        config: ConfigService,
        dummy: DummyPspAdapter,
        http: HttpPspAdapter,
        chapa: ChapaPspAdapter
      ) => {
        const provider = config.get<string>('PSP_PROVIDER');
        if (provider === 'http') return http;
        if (provider === 'chapa') return chapa;
        return dummy;
      },
      inject: [ConfigService, DummyPspAdapter, HttpPspAdapter, ChapaPspAdapter]
    }
  ],
  exports: [ISSUER_ADAPTER, PSP_ADAPTER, IntegrationReadinessService]
})
export class IntegrationsModule {}




















