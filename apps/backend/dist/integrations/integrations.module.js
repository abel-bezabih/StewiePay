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
const dummy_issuer_adapter_1 = require("./issuer/dummy-issuer.adapter");
const dummy_psp_adapter_1 = require("./psp/dummy-psp.adapter");
let IntegrationsModule = class IntegrationsModule {
};
exports.IntegrationsModule = IntegrationsModule;
exports.IntegrationsModule = IntegrationsModule = __decorate([
    (0, common_1.Module)({
        providers: [dummy_issuer_adapter_1.DummyIssuerAdapter, dummy_psp_adapter_1.DummyPspAdapter],
        exports: [dummy_issuer_adapter_1.DummyIssuerAdapter, dummy_psp_adapter_1.DummyPspAdapter]
    })
], IntegrationsModule);
//# sourceMappingURL=integrations.module.js.map