import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, User as PrismaUser } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '../domain/models';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { StorageService } from '../storage/storage.service';

type SafeUser = Omit<PrismaUser, 'passwordHash'>;
export type PaymentAccessTier = 'FULL' | 'LIMITED';
type AutoKycDecision = { status: 'VERIFIED' | 'REJECTED'; rejectionReason?: string; reviewNote: string };

@Injectable()
export class UsersService {
  private readonly userSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    avatarUrl: true,
    role: true,
    emailVerified: true,
    emailVerifiedAt: true,
    createdAt: true,
    updatedAt: true,
    pushToken: true,
    notificationPreferences: true,
    kycStatus: true,
    kycSubmittedAt: true,
    kycVerifiedAt: true,
    kycRejectionReason: true,
    kycDocuments: true
  } satisfies Record<keyof SafeUser, boolean>;

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService
  ) {}

  private isKycAutoReviewEnabled() {
    return (process.env.KYC_AUTO_REVIEW_ENABLED ?? 'true') === 'true';
  }

  private getKycAutoReviewProvider(): 'internal' | 'http' {
    return (process.env.KYC_AUTO_REVIEW_PROVIDER ?? 'internal').toLowerCase() === 'http' ? 'http' : 'internal';
  }

  private getKycAutoReviewHttpFailMode(): 'fallback' | 'reject' {
    return (process.env.KYC_AUTO_REVIEW_HTTP_FAIL_MODE ?? 'fallback').toLowerCase() === 'reject'
      ? 'reject'
      : 'fallback';
  }

  private getKycAutoReviewMode(): 'approve' | 'strict' {
    const mode = (process.env.KYC_AUTO_REVIEW_MODE ?? 'approve').toLowerCase();
    return mode === 'strict' ? 'strict' : 'approve';
  }

  private normalizeBase64(value?: string | null): string {
    if (!value) return '';
    const raw = value.includes(',') ? value.split(',').pop() || '' : value;
    return raw.replace(/\s+/g, '');
  }

  private decodeBase64ToBuffer(value?: string | null): Buffer {
    const normalized = this.normalizeBase64(value);
    if (!normalized) return Buffer.alloc(0);
    return Buffer.from(normalized, 'base64');
  }

  private estimateBase64Bytes(value?: string | null): number {
    const base64 = this.normalizeBase64(value);
    if (!base64) return 0;
    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
  }

  private detectImageFormat(value?: string | null): 'jpeg' | 'png' | 'webp' | 'unknown' {
    const buf = this.decodeBase64ToBuffer(value);
    if (buf.length < 12) return 'unknown';
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
    if (
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a
    ) {
      return 'png';
    }
    if (
      buf[0] === 0x52 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x46 &&
      buf[8] === 0x57 &&
      buf[9] === 0x45 &&
      buf[10] === 0x42 &&
      buf[11] === 0x50
    ) {
      return 'webp';
    }
    return 'unknown';
  }

  private sha256Base64(value?: string | null): string {
    const normalized = this.normalizeBase64(value);
    if (!normalized) return '';
    return createHash('sha256').update(normalized).digest('hex');
  }

  private parseCsvSet(value: string | undefined, fallback: string[]) {
    const source = value?.trim() ? value : fallback.join(',');
    return new Set(
      source
        .split(',')
        .map((v) => v.trim().toLowerCase())
        .filter(Boolean)
    );
  }

  private getStoredKycHashes(documents: unknown): {
    frontHash?: string;
    backHash?: string;
    selfieHash?: string;
  } {
    if (!documents || typeof documents !== 'object' || Array.isArray(documents)) {
      return {};
    }
    const meta = (documents as Record<string, unknown>).meta;
    if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
      return {};
    }
    const fingerprints = (meta as Record<string, unknown>).fingerprints;
    if (!fingerprints || typeof fingerprints !== 'object' || Array.isArray(fingerprints)) {
      return {};
    }
    const fp = fingerprints as Record<string, unknown>;
    return {
      frontHash: typeof fp.frontHash === 'string' ? fp.frontHash : undefined,
      backHash: typeof fp.backHash === 'string' ? fp.backHash : undefined,
      selfieHash: typeof fp.selfieHash === 'string' ? fp.selfieHash : undefined
    };
  }

  private async findDuplicateFingerprint(
    userId: string,
    hash: string,
    field: 'frontHash' | 'backHash' | 'selfieHash'
  ): Promise<{ userId: string; email: string } | null> {
    if (!hash) return null;
    const candidates = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        kycStatus: { in: ['SUBMITTED', 'VERIFIED', 'REJECTED'] }
      },
      select: {
        id: true,
        email: true,
        kycDocuments: true
      },
      take: 5000
    });
    for (const candidate of candidates) {
      const hashes = this.getStoredKycHashes(candidate.kycDocuments);
      if (hashes[field] === hash) {
        return { userId: candidate.id, email: candidate.email };
      }
    }
    return null;
  }

  private async requestHttpAutoReviewDecision(params: {
    userId: string;
    payload: {
      documentType: 'passport' | 'national_id' | 'driver_license';
      country: string;
      documentFront: string;
      documentBack?: string;
      selfie: string;
    };
    fingerprints: { frontHash: string; backHash: string; selfieHash: string };
    imageStats: {
      frontBytes: number;
      backBytes: number;
      selfieBytes: number;
      frontFormat: string;
      backFormat: string;
      selfieFormat: string;
    };
  }): Promise<AutoKycDecision | null> {
    const url = (process.env.KYC_AUTO_REVIEW_HTTP_URL || '').trim();
    if (!url) return null;

    const secret = (process.env.KYC_AUTO_REVIEW_HTTP_SECRET || '').trim();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secret ? { 'x-kyc-auto-secret': secret } : {})
        },
        body: JSON.stringify({
          userId: params.userId,
          payload: {
            documentType: params.payload.documentType,
            country: params.payload.country.trim(),
            hasDocumentBack: Boolean(params.payload.documentBack)
          },
          fingerprints: params.fingerprints,
          imageStats: params.imageStats
        }),
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`HTTP auto-review failed with status ${response.status}`);
      }
      const data = (await response.json()) as {
        status?: string;
        rejectionReason?: string;
        reviewNote?: string;
      };
      if (data.status !== 'VERIFIED' && data.status !== 'REJECTED') {
        throw new Error('HTTP auto-review returned an invalid status');
      }
      return {
        status: data.status,
        rejectionReason: data.rejectionReason,
        reviewNote: data.reviewNote || 'Auto-review decision from HTTP provider.'
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async evaluateAutomatedKycDecision(userId: string, payload: {
    documentType: 'passport' | 'national_id' | 'driver_license';
    country: string;
    documentFront: string;
    documentBack?: string;
    selfie: string;
  }): Promise<AutoKycDecision> {
    const mode = this.getKycAutoReviewMode();
    const minImageBytes = Number(process.env.KYC_AUTO_REVIEW_MIN_IMAGE_BYTES ?? 8_000);
    const maxImageBytes = Number(process.env.KYC_AUTO_REVIEW_MAX_IMAGE_BYTES ?? 8_000_000);

    const frontBytes = this.estimateBase64Bytes(payload.documentFront);
    const backBytes = this.estimateBase64Bytes(payload.documentBack);
    const selfieBytes = this.estimateBase64Bytes(payload.selfie);
    const frontFormat = this.detectImageFormat(payload.documentFront);
    const backFormat = this.detectImageFormat(payload.documentBack);
    const selfieFormat = this.detectImageFormat(payload.selfie);
    const country = (payload.country || '').trim().toLowerCase();
    const frontHash = this.sha256Base64(payload.documentFront);
    const backHash = this.sha256Base64(payload.documentBack);
    const selfieHash = this.sha256Base64(payload.selfie);

    if (!frontHash || !selfieHash) {
      return {
        status: 'REJECTED',
        rejectionReason: 'Invalid KYC image payload.',
        reviewNote: 'Auto-review rejected: missing image hash input.'
      };
    }

    if (!country) {
      return {
        status: 'REJECTED',
        rejectionReason: 'Country is required for automated verification.',
        reviewNote: 'Auto-review rejected: missing country.'
      };
    }

    if (frontBytes < minImageBytes || selfieBytes < minImageBytes) {
      return {
        status: 'REJECTED',
        rejectionReason: 'Document front and selfie must be clear, full-resolution images.',
        reviewNote: `Auto-review rejected: low image size (front=${frontBytes}B, selfie=${selfieBytes}B).`
      };
    }

    if (frontBytes > maxImageBytes || selfieBytes > maxImageBytes || backBytes > maxImageBytes) {
      return {
        status: 'REJECTED',
        rejectionReason: 'Uploaded image size exceeds allowed limits.',
        reviewNote: `Auto-review rejected: oversized image (front=${frontBytes}B, back=${backBytes}B, selfie=${selfieBytes}B).`
      };
    }

    if (frontFormat === 'unknown' || selfieFormat === 'unknown' || (payload.documentBack && backFormat === 'unknown')) {
      return {
        status: 'REJECTED',
        rejectionReason: 'Unsupported image format. Please upload PNG, JPEG, or WEBP images.',
        reviewNote: `Auto-review rejected: unsupported format (front=${frontFormat}, back=${backFormat}, selfie=${selfieFormat}).`
      };
    }

    if (mode === 'strict' && payload.documentType !== 'passport' && !payload.documentBack) {
      return {
        status: 'REJECTED',
        rejectionReason: 'Back side of the document is required for this document type.',
        reviewNote: 'Auto-review rejected: missing required document back image in strict mode.'
      };
    }

    const duplicateSelfie = await this.findDuplicateFingerprint(userId, selfieHash, 'selfieHash');
    if (duplicateSelfie) {
      return {
        status: 'REJECTED',
        rejectionReason: 'Selfie is already used by another account.',
        reviewNote: `Auto-review rejected: selfie fingerprint reused by ${duplicateSelfie.email}.`
      };
    }

    const duplicateFront = await this.findDuplicateFingerprint(userId, frontHash, 'frontHash');
    if (duplicateFront) {
      return {
        status: 'REJECTED',
        rejectionReason: 'Document image is already used by another account.',
        reviewNote: `Auto-review rejected: document fingerprint reused by ${duplicateFront.email}.`
      };
    }

    if (this.getKycAutoReviewProvider() === 'http') {
      try {
        const providerDecision = await this.requestHttpAutoReviewDecision({
          userId,
          payload,
          fingerprints: { frontHash, backHash, selfieHash },
          imageStats: {
            frontBytes,
            backBytes,
            selfieBytes,
            frontFormat,
            backFormat,
            selfieFormat
          }
        });
        if (providerDecision) return providerDecision;
      } catch (error) {
        if (this.getKycAutoReviewHttpFailMode() === 'reject') {
          return {
            status: 'REJECTED',
            rejectionReason: 'Automated KYC provider unavailable. Please retry shortly.',
            reviewNote: `Auto-review rejected: HTTP provider failure (${String((error as Error)?.message || error)}).`
          };
        }
      }
    }

    if (mode === 'strict') {
      const allowedCountries = this.parseCsvSet(process.env.KYC_AUTO_REVIEW_ALLOWED_COUNTRIES, [
        'ethiopia',
        'et',
        'canada',
        'ca'
      ]);
      if (!allowedCountries.has(country)) {
        return {
          status: 'REJECTED',
          rejectionReason: 'Country is currently not eligible for automated KYC.',
          reviewNote: `Auto-review rejected: country "${country}" not in allowlist.`
        };
      }
    }

    return {
      status: 'VERIFIED',
      reviewNote: `Auto-review approved (${mode} mode, internal policy).`
    };
  }

  private async getOrCreateKycAutomationReviewerId(): Promise<string> {
    const reviewerEmail = (process.env.KYC_AUTOMATION_REVIEWER_EMAIL || 'kyc-system@stewiepay.local')
      .trim()
      .toLowerCase();
    const reviewerName = process.env.KYC_AUTOMATION_REVIEWER_NAME || 'StewiePay KYC Automation';

    const existing = await this.prisma.user.findUnique({
      where: { email: reviewerEmail },
      select: { id: true }
    });
    if (existing) return existing.id;

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
    const randomSecret = `kyc-auto-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    const passwordHash = await bcrypt.hash(randomSecret, saltRounds);

    try {
      const created = await this.prisma.user.create({
        data: {
          name: reviewerName,
          email: reviewerEmail,
          role: UserRole.ADMIN,
          passwordHash,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          kycStatus: 'VERIFIED',
          kycVerifiedAt: new Date()
        },
        select: { id: true }
      });
      return created.id;
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const user = await this.prisma.user.findUnique({
          where: { email: reviewerEmail },
          select: { id: true }
        });
        if (user) return user.id;
      }
      throw error;
    }
  }

  sanitize(user: PrismaUser): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async create(dto: CreateUserDto): Promise<SafeUser> {
    const role = dto.role ?? UserRole.INDIVIDUAL;
    const email = dto.email.toLowerCase();
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email,
          phone: dto.phone,
          role,
          passwordHash
        }
      });
      return this.sanitize(user);
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Email already in use');
      }
      throw error;
    }
  }

  async findAll(): Promise<SafeUser[]> {
    return this.prisma.user.findMany({ select: this.userSelect });
  }

  async findById(id: string): Promise<SafeUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.sanitize(user) : null;
  }

  async findByEmail(email: string): Promise<PrismaUser | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async validateUser(email: string, password: string): Promise<SafeUser | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;
    return this.sanitize(user);
  }

  async updateProfile(id: string, dto: { name?: string; email?: string; phone?: string; avatarUrl?: string }): Promise<SafeUser> {
    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.email !== undefined) updateData.email = dto.email.toLowerCase();
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl;

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
    return this.sanitize(user);
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async updatePasswordByEmail(email: string, newPassword: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    });
  }

  async assertPaymentKycEligible(
    userId: string,
    actionLabel = 'perform this action',
    options?: { allowSubmittedWithLimits?: boolean }
  ): Promise<{ tier: PaymentAccessTier; kycStatus: SafeUser['kycStatus'] }> {
    const enforceKyc =
      (process.env.ENFORCE_KYC_FOR_PAYMENTS ??
        (process.env.NODE_ENV === 'production' ? 'true' : 'false')) === 'true';
    if (!enforceKyc) {
      return { tier: 'FULL', kycStatus: 'VERIFIED' };
    }

    const user = await this.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.emailVerified && !user.email.endsWith('.local')) {
      throw new ForbiddenException({
        code: 'EMAIL_VERIFICATION_REQUIRED',
        message: 'Please verify your email before using financial features.'
      });
    }

    if (user.kycStatus === 'VERIFIED') {
      return { tier: 'FULL', kycStatus: user.kycStatus };
    }

    const allowSubmitted =
      (process.env.KYC_ALLOW_SUBMITTED_WITH_LIMITS ?? 'false') === 'true' &&
      options?.allowSubmittedWithLimits === true;
    if (allowSubmitted && user.kycStatus === 'SUBMITTED') {
      return { tier: 'LIMITED', kycStatus: user.kycStatus };
    }

    if (user.kycStatus === 'REJECTED' && user.kycRejectionReason) {
      throw new ForbiddenException({
        code: 'KYC_REJECTED',
        message: `KYC rejected: ${user.kycRejectionReason}`,
        rejectionReason: user.kycRejectionReason
      });
    }

    if (user.kycStatus === 'SUBMITTED') {
      throw new ForbiddenException({
        code: 'KYC_UNDER_REVIEW',
        message: 'Your KYC is under review. Please wait for approval to continue.',
        kycStatus: user.kycStatus
      });
    }

    throw new ForbiddenException({
      code: 'KYC_REQUIRED',
      message: `KYC verification is required to ${actionLabel}.`,
      kycStatus: user.kycStatus
    });
  }

  async uploadAvatar(userId: string, base64Image: string): Promise<SafeUser> {
    // Delete old avatar if it exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.avatarUrl) {
      try {
        await this.storageService.deleteImage(user.avatarUrl);
      } catch (error) {
        // Log but don't fail - old image deletion is best effort
        console.error('Failed to delete old avatar:', error);
      }
    }

    // Upload new image to Cloudinary
    const avatarUrl = await this.storageService.uploadImage(base64Image, 'avatars');

    // Update user with new avatar URL
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return this.sanitize(updatedUser);
  }

  async submitKyc(
    userId: string,
    payload: {
      documentType: 'passport' | 'national_id' | 'driver_license';
      country: string;
      documentFront: string;
      documentBack?: string;
      selfie: string;
    }
  ): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const frontHash = this.sha256Base64(payload.documentFront);
    const backHash = this.sha256Base64(payload.documentBack);
    const selfieHash = this.sha256Base64(payload.selfie);

    const [documentFrontUrl, documentBackUrl, selfieUrl] = await Promise.all([
      this.storageService.uploadImage(payload.documentFront, 'kyc'),
      payload.documentBack ? this.storageService.uploadImage(payload.documentBack, 'kyc') : Promise.resolve(null),
      this.storageService.uploadImage(payload.selfie, 'kyc'),
    ]);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: 'SUBMITTED',
        kycSubmittedAt: new Date(),
        kycVerifiedAt: null,
        kycRejectionReason: null,
        kycDocuments: {
          documentType: payload.documentType,
          country: payload.country,
          documentFrontUrl,
          documentBackUrl,
          selfieUrl,
          meta: {
            autoReviewed: false,
            submittedAt: new Date().toISOString(),
            fingerprints: {
              frontHash,
              backHash: backHash || null,
              selfieHash
            }
          }
        },
      },
    });

    if (!this.isKycAutoReviewEnabled()) {
      return this.sanitize(updatedUser);
    }

    const autoDecision = await this.evaluateAutomatedKycDecision(userId, payload);
    const automationReviewerId = await this.getOrCreateKycAutomationReviewerId();
    await this.updateKycStatus(
      userId,
      {
        status: autoDecision.status,
        rejectionReason: autoDecision.rejectionReason,
        reviewNote: autoDecision.reviewNote
      },
      {
        reviewerId: automationReviewerId,
        reviewerIp: 'system:auto-review',
        reviewerUserAgent: 'stewiepay-kyc-automation'
      }
    );
    const refreshed = await this.findById(userId);
    if (!refreshed) {
      throw new BadRequestException('User not found');
    }
    return refreshed;
  }

  async getKycStatus(userId: string) {
    const [user, latestReview] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          kycStatus: true,
          kycSubmittedAt: true,
          kycVerifiedAt: true,
          kycRejectionReason: true
        }
      }),
      this.prisma.kycReviewEvent.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          previousStatus: true,
          newStatus: true,
          rejectionReason: true,
          reviewNote: true,
          reviewerId: true,
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          createdAt: true
        }
      })
    ]);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return { ...user, latestReview };
  }

  async listKycSubmissions() {
    return this.prisma.user.findMany({
      where: {
        kycStatus: { in: ['SUBMITTED', 'REJECTED', 'VERIFIED'] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        kycStatus: true,
        kycSubmittedAt: true,
        kycVerifiedAt: true,
        kycRejectionReason: true,
        kycDocuments: true
      },
      orderBy: { kycSubmittedAt: 'desc' }
    });
  }

  async updateKycStatus(
    userId: string,
    payload: {
      status: 'VERIFIED' | 'REJECTED';
      rejectionReason?: string;
      reviewNote?: string;
    },
    reviewer: {
      reviewerId: string;
      reviewerIp?: string;
      reviewerUserAgent?: string;
    }
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (payload.status === 'REJECTED' && !payload.rejectionReason?.trim()) {
      throw new BadRequestException('rejectionReason is required when rejecting KYC');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          kycStatus: payload.status,
          kycVerifiedAt: payload.status === 'VERIFIED' ? new Date() : null,
          kycRejectionReason: payload.status === 'REJECTED' ? payload.rejectionReason || 'Verification failed' : null
        },
        select: {
          id: true,
          name: true,
          email: true,
          kycStatus: true,
          kycVerifiedAt: true,
          kycRejectionReason: true
        }
      });

      await tx.kycReviewEvent.create({
        data: {
          userId,
          reviewerId: reviewer.reviewerId,
          previousStatus: user.kycStatus,
          newStatus: payload.status,
          rejectionReason: payload.status === 'REJECTED' ? payload.rejectionReason || 'Verification failed' : null,
          reviewNote: payload.reviewNote?.trim() || null,
          reviewerIp: reviewer.reviewerIp,
          reviewerUserAgent: reviewer.reviewerUserAgent
        }
      });

      return updated;
    });
  }

  async listKycReviews(
    userId: string,
    options?: {
      limit?: number;
      cursor?: string;
      status?: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
      startDate?: string;
      endDate?: string;
      reviewerEmail?: string;
    }
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const take = Math.min(Math.max(options?.limit ?? 20, 1), 100);
    const createdAtFilter: { lt?: Date; gte?: Date; lte?: Date } = {};
    if (options?.cursor) {
      createdAtFilter.lt = new Date(options.cursor);
    }
    if (options?.startDate) {
      createdAtFilter.gte = new Date(options.startDate);
    }
    if (options?.endDate) {
      createdAtFilter.lte = new Date(options.endDate);
    }
    const rows = await this.prisma.kycReviewEvent.findMany({
      where: {
        userId,
        ...(options?.status ? { newStatus: options.status } : {}),
        ...(Object.keys(createdAtFilter).length ? { createdAt: createdAtFilter } : {}),
        ...(options?.reviewerEmail
          ? {
              reviewer: {
                email: {
                  contains: options.reviewerEmail.trim().toLowerCase(),
                  mode: 'insensitive'
                }
              }
            }
          : {})
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      select: {
        id: true,
        previousStatus: true,
        newStatus: true,
        rejectionReason: true,
        reviewNote: true,
        reviewerIp: true,
        reviewerUserAgent: true,
        createdAt: true,
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const hasMore = rows.length > take;
    const items = hasMore ? rows.slice(0, take) : rows;
    const nextCursor = hasMore ? items[items.length - 1]?.createdAt.toISOString() : null;
    return { items, nextCursor };
  }

  async exportKycReviewsCsv(
    userId: string,
    options?: {
      status?: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
      startDate?: string;
      endDate?: string;
      reviewerEmail?: string;
    }
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const createdAtFilter: { gte?: Date; lte?: Date } = {};
    if (options?.startDate) {
      createdAtFilter.gte = new Date(options.startDate);
    }
    if (options?.endDate) {
      createdAtFilter.lte = new Date(options.endDate);
    }

    const rows = await this.prisma.kycReviewEvent.findMany({
      where: {
        userId,
        ...(options?.status ? { newStatus: options.status } : {}),
        ...(Object.keys(createdAtFilter).length ? { createdAt: createdAtFilter } : {}),
        ...(options?.reviewerEmail
          ? {
              reviewer: {
                email: {
                  contains: options.reviewerEmail.trim().toLowerCase(),
                  mode: 'insensitive'
                }
              }
            }
          : {})
      },
      orderBy: { createdAt: 'desc' },
      take: 5000,
      select: {
        id: true,
        previousStatus: true,
        newStatus: true,
        rejectionReason: true,
        reviewNote: true,
        reviewerIp: true,
        reviewerUserAgent: true,
        createdAt: true,
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const headers = [
      'eventId',
      'subjectUserId',
      'subjectUserEmail',
      'createdAt',
      'previousStatus',
      'newStatus',
      'reviewerId',
      'reviewerName',
      'reviewerEmail',
      'rejectionReason',
      'reviewNote',
      'reviewerIp',
      'reviewerUserAgent'
    ];
    const escapeCsv = (value: unknown) => {
      const str = String(value ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const lines = rows.map((row) =>
      [
        row.id,
        user.id,
        user.email,
        row.createdAt.toISOString(),
        row.previousStatus,
        row.newStatus,
        row.reviewer?.id ?? '',
        row.reviewer?.name ?? '',
        row.reviewer?.email ?? '',
        row.rejectionReason ?? '',
        row.reviewNote ?? '',
        row.reviewerIp ?? '',
        row.reviewerUserAgent ?? ''
      ]
        .map(escapeCsv)
        .join(',')
    );

    return [headers.join(','), ...lines].join('\n');
  }

  async exportAllKycReviewsCsv(options?: {
    status?: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
    startDate?: string;
    endDate?: string;
    reviewerEmail?: string;
    subjectEmail?: string;
  }) {
    const createdAtFilter: { gte?: Date; lte?: Date } = {};
    if (options?.startDate) {
      createdAtFilter.gte = new Date(options.startDate);
    }
    if (options?.endDate) {
      createdAtFilter.lte = new Date(options.endDate);
    }

    const rows = await this.prisma.kycReviewEvent.findMany({
      where: {
        ...(options?.status ? { newStatus: options.status } : {}),
        ...(Object.keys(createdAtFilter).length ? { createdAt: createdAtFilter } : {}),
        ...(options?.reviewerEmail
          ? {
              reviewer: {
                email: {
                  contains: options.reviewerEmail.trim().toLowerCase(),
                  mode: 'insensitive'
                }
              }
            }
          : {}),
        ...(options?.subjectEmail
          ? {
              user: {
                email: {
                  contains: options.subjectEmail.trim().toLowerCase(),
                  mode: 'insensitive'
                }
              }
            }
          : {})
      },
      orderBy: { createdAt: 'desc' },
      take: 20000,
      select: {
        id: true,
        previousStatus: true,
        newStatus: true,
        rejectionReason: true,
        reviewNote: true,
        reviewerIp: true,
        reviewerUserAgent: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const headers = [
      'eventId',
      'subjectUserId',
      'subjectUserEmail',
      'createdAt',
      'previousStatus',
      'newStatus',
      'reviewerId',
      'reviewerName',
      'reviewerEmail',
      'rejectionReason',
      'reviewNote',
      'reviewerIp',
      'reviewerUserAgent'
    ];
    const escapeCsv = (value: unknown) => {
      const str = String(value ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const lines = rows.map((row) =>
      [
        row.id,
        row.user?.id ?? '',
        row.user?.email ?? '',
        row.createdAt.toISOString(),
        row.previousStatus,
        row.newStatus,
        row.reviewer?.id ?? '',
        row.reviewer?.name ?? '',
        row.reviewer?.email ?? '',
        row.rejectionReason ?? '',
        row.reviewNote ?? '',
        row.reviewerIp ?? '',
        row.reviewerUserAgent ?? ''
      ]
        .map(escapeCsv)
        .join(',')
    );

    return [headers.join(','), ...lines].join('\n');
  }
}

