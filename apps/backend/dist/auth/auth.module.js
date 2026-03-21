"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
const user_module_1 = require("../users/user.module");
const jwt_strategy_1 = require("./jwt.strategy");
const refresh_token_service_1 = require("./refresh-token.service");
const signup_rate_limit_guard_1 = require("./signup-rate-limit.guard");
const prisma_module_1 = require("../prisma/prisma.module");
const email_module_1 = require("../email/email.module");
const login_rate_limit_guard_1 = require("./login-rate-limit.guard");
const forgot_password_rate_limit_guard_1 = require("./forgot-password-rate-limit.guard");
const resolveJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (secret)
        return secret;
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be set in production');
    }
    return 'dev-secret';
};
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            user_module_1.UsersModule,
            prisma_module_1.PrismaModule,
            email_module_1.EmailModule,
            passport_1.PassportModule,
            jwt_1.JwtModule.registerAsync({
                useFactory: () => ({
                    secret: resolveJwtSecret(),
                    signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
                })
            })
        ],
        providers: [
            auth_service_1.AuthService,
            jwt_strategy_1.JwtStrategy,
            refresh_token_service_1.RefreshTokenService,
            signup_rate_limit_guard_1.SignupRateLimitGuard,
            login_rate_limit_guard_1.LoginRateLimitGuard,
            forgot_password_rate_limit_guard_1.ForgotPasswordRateLimitGuard
        ],
        controllers: [auth_controller_1.AuthController],
        exports: [auth_service_1.AuthService]
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map