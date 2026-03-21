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
exports.ChapaPspAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ChapaPspAdapter = class ChapaPspAdapter {
    constructor(config) {
        this.config = config;
        this.baseUrl = 'https://api.chapa.co/v1';
        this.secretKey = this.config.get('PSP_API_KEY');
        this.callbackUrl = this.config.get('CHAPA_CALLBACK_URL');
        this.returnUrl = this.config.get('CHAPA_RETURN_URL');
        this.title = this.config.get('CHAPA_CUSTOMIZATION_TITLE');
        this.description = this.config.get('CHAPA_CUSTOMIZATION_DESCRIPTION');
        this.defaultEmail = this.config.get('CHAPA_DEFAULT_EMAIL');
    }
    assertConfigured() {
        if (!this.secretKey) {
            throw new Error('Chapa is not configured. Set PSP_API_KEY.');
        }
    }
    isValidEmail(value) {
        if (!value)
            return false;
        const email = value.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return false;
        const domain = email.split('@')[1] || '';
        if (domain === 'localhost' || domain.endsWith('.local') || domain.endsWith('.localhost')) {
            return false;
        }
        return true;
    }
    async request(path, method, body) {
        this.assertConfigured();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const resp = await fetch(`${this.baseUrl}${path}`, {
                method,
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                    'Content-Type': 'application/json'
                },
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal
            });
            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(text || `Chapa request failed (${resp.status})`);
            }
            return (await resp.json());
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async initiateTopUp(request) {
        const emailCandidates = [
            request.email,
            this.defaultEmail,
            this.config.get('EMAIL_FROM'),
            this.config.get('GMAIL_USER'),
            'stewiepay.verify@gmail.com'
        ];
        const email = emailCandidates.find((candidate) => this.isValidEmail(candidate)) || 'stewiepay.verify@gmail.com';
        const payload = {
            amount: String(request.amount),
            currency: request.currency || 'ETB',
            tx_ref: request.reference,
            email,
            first_name: request.firstName || 'StewiePay',
            last_name: request.lastName || 'User'
        };
        if (request.phoneNumber)
            payload.phone_number = request.phoneNumber;
        if (request.callbackUrl || this.callbackUrl)
            payload.callback_url = request.callbackUrl || this.callbackUrl;
        if (request.returnUrl || this.returnUrl)
            payload.return_url = request.returnUrl || this.returnUrl;
        if (this.title || this.description) {
            payload.customization = {
                title: this.title || 'StewiePay Top Up',
                description: this.description || 'Complete your top up securely'
            };
        }
        const resp = await this.request('/transaction/initialize', 'POST', payload);
        const checkoutUrl = resp.data?.checkout_url;
        return {
            provider: 'chapa',
            providerReference: request.reference,
            status: 'PENDING',
            checkoutUrl,
            rawStatus: resp.status
        };
    }
    async verifyTopUp(providerReference) {
        const resp = await this.request(`/transaction/verify/${providerReference}`, 'GET');
        const rawStatus = resp.data?.status || resp.status;
        const normalized = rawStatus === 'success' || rawStatus === 'SUCCESS'
            ? 'COMPLETED'
            : rawStatus === 'failed' || rawStatus === 'FAILED'
                ? 'FAILED'
                : 'PENDING';
        return {
            provider: 'chapa',
            providerReference,
            status: normalized,
            rawStatus
        };
    }
};
exports.ChapaPspAdapter = ChapaPspAdapter;
exports.ChapaPspAdapter = ChapaPspAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ChapaPspAdapter);
//# sourceMappingURL=chapa-psp.adapter.js.map