import { Module } from '@nestjs/common';
import { TopUpService } from './topup.service';
import { TopUpController } from './topup.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { UsersModule } from '../users/user.module';

@Module({
  imports: [PrismaModule, IntegrationsModule, UsersModule],
  controllers: [TopUpController],
  providers: [TopUpService]
})
export class TopUpModule {}




















