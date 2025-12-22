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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const user_service_1 = require("../users/user.service");
const refresh_token_service_1 = require("./refresh-token.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService, refreshTokens) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.refreshTokens = refreshTokens;
    }
    /**
     * Enhanced signup with security checks
     */
    async signup(dto) {
        // Additional security validations
        this.validateSignupData(dto);
        // Check if email already exists (double-check before creation)
        const existingUser = await this.usersService.findByEmail(dto.email);
        if (existingUser) {
            throw new common_1.BadRequestException('Email already in use');
        }
        // Create user
        const user = await this.usersService.create(dto);
        // Issue tokens
        const tokens = await this.issueTokens(user.id, user.email, user.role);
        // TODO: Send email verification
        // await this.emailService.sendVerificationEmail(user.email, user.id);
        // TODO: Log signup event for audit
        // await this.auditLogService.log({
        //   userId: user.id,
        //   action: 'USER_SIGNUP',
        //   metadata: { email: user.email, role: user.role }
        // });
        return {
            user,
            ...tokens,
            message: 'Account created successfully. Please verify your email to continue.'
        };
    }
    /**
     * Validate signup data for security
     */
    validateSignupData(dto) {
        // Check for common disposable email domains (can be expanded)
        const disposableDomains = [
            'tempmail.com',
            'guerrillamail.com',
            'mailinator.com',
            '10minutemail.com'
        ];
        const emailDomain = dto.email.split('@')[1]?.toLowerCase();
        if (disposableDomains.includes(emailDomain)) {
            throw new common_1.BadRequestException('Disposable email addresses are not allowed');
        }
        // Check for suspicious patterns in name
        if (dto.name.trim().length < 2) {
            throw new common_1.BadRequestException('Name must be at least 2 characters');
        }
        // Check for common weak passwords
        const weakPasswords = ['password', '12345678', 'password123', 'qwerty123'];
        if (weakPasswords.includes(dto.password.toLowerCase())) {
            throw new common_1.BadRequestException('Password is too weak. Please choose a stronger password.');
        }
        // Validate phone format if provided
        if (dto.phone) {
            // Remove all non-digit characters for validation
            const phoneDigits = dto.phone.replace(/\D/g, '');
            if (phoneDigits.length < 10 || phoneDigits.length > 15) {
                throw new common_1.BadRequestException('Invalid phone number format');
            }
        }
    }
    async login(dto) {
        try {
            const user = await this.usersService.validateUser(dto.email, dto.password);
            if (!user) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            // TODO: Check if account is suspended/disabled
            // if (user.status === 'SUSPENDED') {
            //   throw new UnauthorizedException('Account has been suspended');
            // }
            // TODO: Check if email is verified (optional for MVP)
            // if (!user.emailVerified) {
            //   throw new UnauthorizedException('Please verify your email before logging in');
            // }
            const tokens = await this.issueTokens(user.id, user.email, user.role);
            return {
                user,
                ...tokens
            };
        }
        catch (error) {
            console.error('Login error:', error);
            if (error instanceof common_1.UnauthorizedException || error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Login failed: ${error.message || 'Unknown error'}`);
        }
    }
    signToken(sub, email, role) {
        return this.jwtService.sign({ sub, email, role }, {
            expiresIn: process.env.JWT_EXPIRES_IN || '15m',
            secret: process.env.JWT_SECRET || 'dev-secret'
        });
    }
    async issueTokens(sub, email, role) {
        try {
            const token = this.signToken(sub, email, role);
            const refreshToken = await this.refreshTokens.generate(sub);
            return { token, refreshToken };
        }
        catch (error) {
            console.error('Error issuing tokens:', error);
            throw new common_1.BadRequestException(`Failed to generate tokens: ${error.message || 'Unknown error'}`);
        }
    }
    async me(userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException();
        }
        return user;
    }
    async refresh(dto) {
        const { userId, refreshToken } = await this.refreshTokens.rotate(dto.refreshToken);
        const user = await this.usersService.findById(userId);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid refresh token');
        const token = this.signToken(user.id, user.email, user.role);
        return { user, token, refreshToken };
    }
    async logout(refreshToken) {
        await this.refreshTokens.revoke(refreshToken);
        return { success: true };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UsersService,
        jwt_1.JwtService,
        refresh_token_service_1.RefreshTokenService])
], AuthService);
//# sourceMappingURL=auth.service.js.map