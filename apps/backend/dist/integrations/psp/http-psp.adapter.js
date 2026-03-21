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
exports.HttpPspAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let HttpPspAdapter = class HttpPspAdapter {
    constructor(config) {
        this.config = config;
        this.baseUrl = this.config.get('PSP_BASE_URL');
        this.apiKey = this.config.get('PSP_API_KEY');
    }
    assertConfigured() {
        if (!this.baseUrl || !this.apiKey) {
            throw new Error('PSP not configured. Set PSP_BASE_URL and PSP_API_KEY.');
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
                throw new Error(text || `PSP request failed (${resp.status})`);
            }
            return (await resp.json());
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async initiateTopUp(request) {
        return this.request('/topups/initiate', request);
    }
    async verifyTopUp(providerReference) {
        return this.request('/topups/verify', { providerReference });
    }
};
exports.HttpPspAdapter = HttpPspAdapter;
exports.HttpPspAdapter = HttpPspAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], HttpPspAdapter);
//# sourceMappingURL=http-psp.adapter.js.map