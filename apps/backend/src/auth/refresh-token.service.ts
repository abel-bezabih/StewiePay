import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

type RefreshTokenRecord = {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

@Injectable()
export class RefreshTokenService {
  constructor(private prisma: PrismaService) {}

  private ttlDays() {
    return Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30);
  }

  private saltRounds() {
    return Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
  }

  private buildTokenString(id: string, raw: string) {
    return `${id}.${raw}`;
  }

  private parseTokenString(token: string): { id: string; raw: string } {
    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new UnauthorizedException('Invalid refresh token format');
    }
    return { id: parts[0], raw: parts[1] };
  }

  async generate(userId: string): Promise<string> {
    const raw = crypto.randomBytes(48).toString('hex');
    const id = crypto.randomUUID();
    const tokenHash = await bcrypt.hash(raw, this.saltRounds());
    const expiresAt = new Date(Date.now() + this.ttlDays() * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { id, tokenHash, userId, expiresAt }
    });

    return this.buildTokenString(id, raw);
  }

  private assertValid(record: RefreshTokenRecord) {
    if (record.revokedAt) {
      throw new UnauthorizedException('Refresh token revoked');
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }
  }

  async verify(token: string): Promise<RefreshTokenRecord> {
    const { id, raw } = this.parseTokenString(token);
    const record = await this.prisma.refreshToken.findUnique({ where: { id } });
    if (!record) throw new UnauthorizedException('Invalid refresh token');
    this.assertValid(record);

    const matches = await bcrypt.compare(raw, record.tokenHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return record;
  }

  async rotate(token: string): Promise<{ userId: string; refreshToken: string }> {
    const record = await this.verify(token);
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() }
    });
    const newToken = await this.generate(record.userId);
    return { userId: record.userId, refreshToken: newToken };
  }

  async revoke(token: string): Promise<void> {
    const { id } = this.parseTokenString(token);
    await this.prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }
}

