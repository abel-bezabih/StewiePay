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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpIssuerAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let HttpIssuerAdapter = class HttpIssuerAdapter {
    constructor(config) {
        this.config = config;
        this.baseUrl = this.config.get('ISSUER_BASE_URL');
        this.apiKey = this.config.get('ISSUER_API_KEY');
    }
    assertConfigured() {
        if (!this.baseUrl || !this.apiKey) {
            throw new Error('Issuer not configured. Set ISSUER_BASE_URL and ISSUER_API_KEY.');
        }
    }
    async request(path, body) {
        this.assertConfigured();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        try {
            const resp = await fetch(`${this.baseUrl}${path}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`
                },
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal
            });
            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(text || `Issuer request failed (${resp.status})`);
            }
            return (await resp.json());
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async issueCard(request) {
        return this.request('/cards/issue', request);
    }
    async freezeCard(issuerCardId) {
        const resp = await this.request('/cards/freeze', { issuerCardId });
        return resp.status;
    }
    async unfreezeCard(issuerCardId) {
        const resp = await this.request('/cards/unfreeze', { issuerCardId });
        return resp.status;
    }
};
exports.HttpIssuerAdapter = HttpIssuerAdapter;
exports.HttpIssuerAdapter = HttpIssuerAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], HttpIssuerAdapter);
//# sourceMappingURL=http-issuer.adapter.js.map