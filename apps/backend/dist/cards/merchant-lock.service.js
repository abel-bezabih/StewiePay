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
exports.MerchantLockService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let MerchantLockService = class MerchantLockService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Check if a transaction is allowed based on merchant locks
     */
    async validateTransaction(card, merchantName, mcc, category) {
        // If card is frozen or closed, reject
        if (card.status !== 'ACTIVE') {
            throw new common_1.BadRequestException(`Card is ${card.status.toLowerCase()}`);
        }
        // Check card type-specific restrictions
        this.validateCardTypeRestrictions(card.type, merchantName, mcc, category);
        // If no merchant lock mode is set, allow all transactions
        if (!card.merchantLockMode) {
            return;
        }
        const normalizedMerchant = this.normalizeMerchantName(merchantName);
        const mccCode = mcc || category;
        if (card.merchantLockMode === 'BLOCK') {
            // Block mode: reject if in blocked lists
            if (card.blockedCategories.length > 0 && mccCode) {
                if (card.blockedCategories.includes(mccCode)) {
                    throw new common_1.BadRequestException(`Transaction blocked: Merchant category "${mccCode}" is not allowed`);
                }
            }
            if (card.blockedMerchants.length > 0) {
                const isBlocked = card.blockedMerchants.some((blocked) => normalizedMerchant.includes(this.normalizeMerchantName(blocked)));
                if (isBlocked) {
                    throw new common_1.BadRequestException(`Transaction blocked: Merchant "${merchantName}" is not allowed`);
                }
            }
        }
        else if (card.merchantLockMode === 'ALLOW') {
            // Allow mode: only allow if in allowed lists
            let categoryAllowed = true;
            let merchantAllowed = true;
            if (card.allowedCategories.length > 0) {
                categoryAllowed = mccCode ? card.allowedCategories.includes(mccCode) : false;
            }
            if (card.allowedMerchants.length > 0) {
                merchantAllowed = card.allowedMerchants.some((allowed) => normalizedMerchant.includes(this.normalizeMerchantName(allowed)));
            }
            // If both lists are empty, allow all (backward compatibility)
            if (card.allowedCategories.length === 0 && card.allowedMerchants.length === 0) {
                return;
            }
            // Must match at least one allowed category OR one allowed merchant
            if (!categoryAllowed && !merchantAllowed) {
                throw new common_1.BadRequestException(`Transaction blocked: Merchant "${merchantName}" is not in the allowed list`);
            }
        }
    }
    /**
     * Validate card type-specific restrictions
     */
    validateCardTypeRestrictions(cardType, merchantName, mcc, category) {
        switch (cardType) {
            case client_1.CardType.SUBSCRIPTION_ONLY:
                // Subscription-only cards should only allow recurring merchants
                // This is a simplified check - in production, you'd check transaction type
                // For now, we'll allow if it's a known subscription merchant
                const subscriptionMerchants = [
                    'netflix',
                    'spotify',
                    'amazon prime',
                    'apple',
                    'google',
                    'microsoft',
                    'adobe'
                ];
                const isSubscriptionMerchant = subscriptionMerchants.some((sub) => merchantName.toLowerCase().includes(sub));
                if (!isSubscriptionMerchant) {
                    throw new common_1.BadRequestException('This card is restricted to subscription payments only');
                }
                break;
            case client_1.CardType.ADS_ONLY:
                // Ads-only cards should only allow advertising platforms
                const adsMerchants = ['google ads', 'facebook ads', 'meta', 'twitter ads', 'linkedin ads'];
                const isAdsMerchant = adsMerchants.some((ads) => merchantName.toLowerCase().includes(ads));
                if (!isAdsMerchant) {
                    throw new common_1.BadRequestException('This card is restricted to advertising platform payments only');
                }
                break;
            case client_1.CardType.MERCHANT_LOCKED:
                // MERCHANT_LOCKED cards must have merchant locks configured
                // This is enforced at the transaction level
                break;
            case client_1.CardType.BURNER:
            case client_1.CardType.PERMANENT:
                // No special restrictions
                break;
        }
    }
    /**
     * Normalize merchant name for comparison
     */
    normalizeMerchantName(name) {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ');
    }
    /**
     * Update merchant locks for a card
     */
    async updateMerchantLocks(cardId, config) {
        // Validate that mode is set if any locks are configured
        if ((config.blockedCategories?.length || config.blockedMerchants?.length) &&
            config.merchantLockMode !== 'BLOCK') {
            throw new common_1.BadRequestException('merchantLockMode must be "BLOCK" when using blockedCategories or blockedMerchants');
        }
        if ((config.allowedCategories?.length || config.allowedMerchants?.length) &&
            config.merchantLockMode !== 'ALLOW') {
            throw new common_1.BadRequestException('merchantLockMode must be "ALLOW" when using allowedCategories or allowedMerchants');
        }
        return this.prisma.card.update({
            where: { id: cardId },
            data: {
                blockedCategories: config.blockedCategories || [],
                allowedCategories: config.allowedCategories || [],
                blockedMerchants: config.blockedMerchants || [],
                allowedMerchants: config.allowedMerchants || [],
                merchantLockMode: config.merchantLockMode || null
            }
        });
    }
    /**
     * Get common MCC categories for reference
     */
    getCommonMccCategories() {
        return {
            '5411': 'Grocery Stores',
            '5812': 'Eating Places, Restaurants',
            '5814': 'Fast Food Restaurants',
            '5541': 'Service Stations',
            '5999': 'Miscellaneous Stores',
            '5734': 'Computer Software Stores',
            '5813': 'Drinking Places',
            '5912': 'Drug Stores, Pharmacies',
            '5970': 'Artists Supply Stores',
            '5971': 'Art Dealers and Galleries',
            '7994': 'Video Game Arcades',
            '7995': 'Betting/Casino Gambling',
            '7273': 'Dating Services',
            '7841': 'Video Tape Rental Stores',
            '7922': 'Theatrical Producers',
            '7929': 'Bands, Orchestras',
            '7932': 'Billiard and Pool Establishments',
            '7933': 'Bowling Alleys',
            '7941': 'Commercial Sports',
            '7991': 'Tourist Attractions',
            '7992': 'Public Golf Courses',
            '7993': 'Video Amusement Game Supplies',
            '7996': 'Amusement Parks',
            '7997': 'Membership Clubs',
            '7998': 'Aquariums',
            '7999': 'Recreation Services'
        };
    }
};
exports.MerchantLockService = MerchantLockService;
exports.MerchantLockService = MerchantLockService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MerchantLockService);
//# sourceMappingURL=merchant-lock.service.js.map