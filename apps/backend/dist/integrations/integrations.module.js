"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const dummy_issuer_adapter_1 = require("./issuer/dummy-issuer.adapter");
const dummy_psp_adapter_1 = require("./psp/dummy-psp.adapter");
const http_issuer_adapter_1 = require("./issuer/http-issuer.adapter");
const http_psp_adapter_1 = require("./psp/http-psp.adapter");
const chapa_psp_adapter_1 = require("./psp/chapa-psp.adapter");
const issuer_adapter_1 = require("./issuer/issuer.adapter");
const psp_adapter_1 = require("./psp/psp.adapter");
const integration_readiness_service_1 = require("./integration-readiness.service");
let IntegrationsModule = class IntegrationsModule {
};
exports.IntegrationsModule = IntegrationsModule;
exports.IntegrationsModule = IntegrationsModule = __decorate([
    (0, common_1.Module)({
        providers: [
            dummy_issuer_adapter_1.DummyIssuerAdapter,
            dummy_psp_adapter_1.DummyPspAdapter,
            http_issuer_adapter_1.HttpIssuerAdapter,
            http_psp_adapter_1.HttpPspAdapter,
            chapa_psp_adapter_1.ChapaPspAdapter,
            integration_readiness_service_1.IntegrationReadinessService,
            {
                provide: issuer_adapter_1.ISSUER_ADAPTER,
                useFactory: (config, dummy, http) => (config.get('ISSUER_PROVIDER') === 'http' ? http : dummy),
                inject: [config_1.ConfigService, dummy_issuer_adapter_1.DummyIssuerAdapter, http_issuer_adapter_1.HttpIssuerAdapter]
            },
            {
                provide: psp_adapter_1.PSP_ADAPTER,
                useFactory: (config, dummy, http, chapa) => {
                    const provider = config.get('PSP_PROVIDER');
                    if (provider === 'http')
                        return http;
                    if (provider === 'chapa')
                        return chapa;
                    return dummy;
                },
                inject: [config_1.ConfigService, dummy_psp_adapter_1.DummyPspAdapter, http_psp_adapter_1.HttpPspAdapter, chapa_psp_adapter_1.ChapaPspAdapter]
            }
        ],
        exports: [issuer_adapter_1.ISSUER_ADAPTER, psp_adapter_1.PSP_ADAPTER, integration_readiness_service_1.IntegrationReadinessService]
    })
], IntegrationsModule);
//# sourceMappingURL=integrations.module.js.map