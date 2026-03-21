"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopUpModule = void 0;
const common_1 = require("@nestjs/common");
const topup_service_1 = require("./topup.service");
const topup_controller_1 = require("./topup.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const integrations_module_1 = require("../integrations/integrations.module");
const user_module_1 = require("../users/user.module");
let TopUpModule = class TopUpModule {
};
exports.TopUpModule = TopUpModule;
exports.TopUpModule = TopUpModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, integrations_module_1.IntegrationsModule, user_module_1.UsersModule],
        controllers: [topup_controller_1.TopUpController],
        providers: [topup_service_1.TopUpService]
    })
], TopUpModule);
//# sourceMappingURL=topup.module.js.map