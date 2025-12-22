import { Module } from '@nestjs/common';
import { DummyIssuerAdapter } from './issuer/dummy-issuer.adapter';
import { DummyPspAdapter } from './psp/dummy-psp.adapter';

@Module({
  providers: [DummyIssuerAdapter, DummyPspAdapter],
  exports: [DummyIssuerAdapter, DummyPspAdapter]
})
export class IntegrationsModule {}












