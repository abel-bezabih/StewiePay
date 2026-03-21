import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private transporter;
    constructor(configService: ConfigService);
    /**
     * Send password reset email
     * @param email - Recipient email address
     * @param resetToken - JWT token for password reset
     * @param userName - Optional user name for personalization
     */
    sendPasswordResetEmail(email: string, resetToken: string, userName?: string): Promise<void>;
    /**
     * Send organization invite email
     */
    sendOrganizationInviteEmail(email: string, inviteToken: string, orgName: string, inviterName?: string): Promise<void>;
    sendEmailVerificationEmail(email: string, verificationToken: string, userName?: string, backendPublicUrlOverride?: string): Promise<void>;
    private hasEmailCredentials;
    /**
     * Get password reset URL based on environment
     */
    private getPasswordResetUrl;
    private getInviteUrl;
    private getEmailVerificationUrl;
    /**
     * HTML email template for password reset
     */
    private getPasswordResetEmailTemplate;
    /**
     * Plain text email template for password reset
     */
    private getPasswordResetEmailTextTemplate;
}
