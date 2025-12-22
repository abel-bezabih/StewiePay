import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Allow the app to start in scaffold mode without a database by skipping Prisma connection
    // when DATABASE_URL is missing or an explicit SKIP_PRISMA flag is set. This keeps Phase 1/2
    // scaffolds runnable before local Postgres is provisioned.
    if (process.env.SKIP_PRISMA === '1' || !process.env.DATABASE_URL) {
      // eslint-disable-next-line no-console
      console.warn(
        '[Prisma] SKIP_PRISMA enabled or DATABASE_URL missing; skipping database connection.'
      );
      return;
    }
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

