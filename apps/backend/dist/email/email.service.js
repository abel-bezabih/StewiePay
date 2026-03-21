"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
let EmailService = class EmailService {
    constructor(configService) {
        this.configService = configService;
        // Configure email transporter
        // Support multiple providers: Gmail, SendGrid, AWS SES, or SMTP
        const emailProvider = this.configService.get('EMAIL_PROVIDER', 'smtp');
        if (emailProvider === 'sendgrid') {
            // SendGrid configuration
            const sendgridKey = this.configService.get('SENDGRID_API_KEY');
            if (!sendgridKey) {
                console.warn('[EmailService] SENDGRID_API_KEY not configured. Email sending will fail.');
                console.warn('[EmailService] Please set SENDGRID_API_KEY in your .env file.');
            }
            this.transporter = nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: 'apikey',
                    pass: sendgridKey,
                },
            });
        }
        else if (emailProvider === 'gmail') {
            // Gmail configuration
            const gmailUser = this.configService.get('GMAIL_USER');
            const gmailPassword = this.configService.get('GMAIL_APP_PASSWORD');
            if (!gmailUser || !gmailPassword) {
                console.warn('[EmailService] Gmail credentials not configured. Email sending will fail.');
                console.warn('[EmailService] Please set GMAIL_USER and GMAIL_APP_PASSWORD in your .env file.');
                console.warn('[EmailService] See EMAIL_SETUP.md for instructions on getting a Gmail App Password.');
            }
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: gmailUser,
                    pass: gmailPassword,
                },
            });
        }
        else {
            // Generic SMTP configuration
            const smtpHost = this.configService.get('SMTP_HOST', 'smtp.gmail.com');
            const smtpPort = Number(this.configService.get('SMTP_PORT', '587'));
            const smtpSecure = this.configService.get('SMTP_SECURE', 'false') === 'true';
            const smtpUser = this.configService.get('SMTP_USER');
            const smtpPassword = this.configService.get('SMTP_PASSWORD');
            if (!smtpUser || !smtpPassword) {
                console.warn('[EmailService] SMTP credentials not configured. Email sending will fail.');
                console.warn('[EmailService] Please set SMTP_USER and SMTP_PASSWORD in your .env file.');
                console.warn('[EmailService] Or set EMAIL_PROVIDER="gmail" with GMAIL_USER and GMAIL_APP_PASSWORD.');
            }
            // Only include auth if credentials are provided
            const smtpConfig = {
                host: smtpHost,
                port: smtpPort,
                secure: smtpSecure,
            };
            if (smtpUser && smtpPassword) {
                smtpConfig.auth = {
                    user: smtpUser,
                    pass: smtpPassword,
                };
            }
            this.transporter = nodemailer.createTransport(smtpConfig);
        }
        // Verify connection in development
        if (process.env.NODE_ENV === 'development') {
            this.transporter.verify().catch((error) => {
                console.warn('[EmailService] Email configuration error:', error.message);
                console.warn('[EmailService] Email sending will fail. Check your email credentials in .env file.');
                console.warn('[EmailService] See apps/backend/EMAIL_SETUP.md for setup instructions.');
            });
        }
    }
    /**
     * Send password reset email
     * @param email - Recipient email address
     * @param resetToken - JWT token for password reset
     * @param userName - Optional user name for personalization
     */
    async sendPasswordResetEmail(email, resetToken, userName) {
        if (!this.hasEmailCredentials()) {
            const errorMsg = `Email credentials not configured. Please set up email in your .env file. See apps/backend/EMAIL_SETUP.md for instructions.`;
            console.error(`[EmailService] ${errorMsg}`);
            throw new Error(errorMsg);
        }
        const resetUrl = this.getPasswordResetUrl(resetToken);
        const fromEmail = this.configService.get('EMAIL_FROM', 'noreply@stewiepay.com');
        const appName = 'StewiePay';
        const htmlContent = this.getPasswordResetEmailTemplate(userName || 'User', resetUrl, appName);
        const textContent = this.getPasswordResetEmailTextTemplate(userName || 'User', resetUrl, appName);
        try {
            await this.transporter.sendMail({
                from: `"${appName}" <${fromEmail}>`,
                to: email,
                subject: 'Reset Your Password',
                text: textContent,
                html: htmlContent,
            });
            if (process.env.NODE_ENV === 'development') {
                console.log(`[EmailService] ✓ Password reset email sent to: ${email}`);
            }
        }
        catch (error) {
            const errorDetails = error.message || 'Unknown error';
            console.error('[EmailService] Failed to send password reset email:', errorDetails);
            // Provide more helpful error messages
            if (errorDetails.includes('Missing credentials') || errorDetails.includes('Invalid login')) {
                throw new Error('Email credentials are invalid or missing. Please check your .env file configuration.');
            }
            else if (errorDetails.includes('timeout') || errorDetails.includes('ECONNREFUSED')) {
                throw new Error('Could not connect to email server. Please check your SMTP settings.');
            }
            else {
                throw new Error(`Failed to send password reset email: ${errorDetails}`);
            }
        }
    }
    /**
     * Send organization invite email
     */
    async sendOrganizationInviteEmail(email, inviteToken, orgName, inviterName) {
        if (!this.hasEmailCredentials()) {
            const errorMsg = `Email credentials not configured. Please set up email in your .env file. See apps/backend/EMAIL_SETUP.md for instructions.`;
            console.error(`[EmailService] ${errorMsg}`);
            if (process.env.NODE_ENV === 'development') {
                console.warn('[EmailService] Skipping invite email in development.');
                return;
            }
            throw new Error(errorMsg);
        }
        const inviteUrl = this.getInviteUrl(inviteToken);
        const fromEmail = this.configService.get('EMAIL_FROM', 'noreply@stewiepay.com');
        const appName = 'StewiePay';
        const inviter = inviterName || 'A StewiePay admin';
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to ${orgName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 700;">${appName}</h1>
  </div>
  <div style="background: #FFFFFF; padding: 40px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #111827; margin-top: 0; font-size: 22px; font-weight: 600;">You're invited to ${orgName}</h2>
    <p style="color: #374151; font-size: 16px;">${inviter} invited you to join the ${orgName} team in StewiePay.</p>
    <p style="color: #374151; font-size: 16px;">Click the button below to accept the invite:</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${inviteUrl}" style="background: #7C3AED; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; display: inline-block;">Accept Invite</a>
    </div>
    <p style="color: #6B7280; font-size: 14px;">If you didn't request this invite, you can ignore this email.</p>
  </div>
</body>
</html>`;
        const textContent = `${inviter} invited you to join the ${orgName} team in StewiePay.\nAccept invite: ${inviteUrl}`;
        try {
            await this.transporter.sendMail({
                from: `"${appName}" <${fromEmail}>`,
                to: email,
                subject: `You're invited to ${orgName}`,
                text: textContent,
                html: htmlContent,
            });
            if (process.env.NODE_ENV === 'development') {
                console.log(`[EmailService] ✓ Organization invite sent to: ${email}`);
            }
        }
        catch (error) {
            const errorDetails = error.message || 'Unknown error';
            console.error('[EmailService] Failed to send invite email:', errorDetails);
            throw new Error(`Failed to send invite email: ${errorDetails}`);
        }
    }
    async sendEmailVerificationEmail(email, verificationToken, userName, backendPublicUrlOverride) {
        if (!this.hasEmailCredentials()) {
            const errorMsg = `Email credentials not configured. Please set up email in your .env file. See apps/backend/EMAIL_SETUP.md for instructions.`;
            console.error(`[EmailService] ${errorMsg}`);
            throw new Error(errorMsg);
        }
        const verifyUrl = this.getEmailVerificationUrl(verificationToken, backendPublicUrlOverride);
        const fromEmail = this.configService.get('EMAIL_FROM', 'noreply@stewiepay.com');
        const appName = 'StewiePay';
        const name = userName || 'User';
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 700;">${appName}</h1>
  </div>
  <div style="background: #FFFFFF; padding: 40px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #111827; margin-top: 0; font-size: 22px; font-weight: 600;">Verify your email</h2>
    <p style="color: #374151; font-size: 16px;">Hi ${name}, welcome to StewiePay.</p>
    <p style="color: #374151; font-size: 16px;">Click below to verify your email address:</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${verifyUrl}" style="background: #7C3AED; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; display: inline-block;">Verify Email</a>
    </div>
    <p style="color: #6B7280; font-size: 14px;">If you did not create this account, you can ignore this email.</p>
  </div>
</body>
</html>`;
        const textContent = `Hi ${name}, verify your email: ${verifyUrl}`;
        await this.transporter.sendMail({
            from: `"${appName}" <${fromEmail}>`,
            to: email,
            subject: 'Verify your StewiePay email',
            text: textContent,
            html: htmlContent
        });
    }
    hasEmailCredentials() {
        const emailProvider = this.configService.get('EMAIL_PROVIDER', 'smtp');
        if (emailProvider === 'gmail') {
            return !!(this.configService.get('GMAIL_USER') &&
                this.configService.get('GMAIL_APP_PASSWORD'));
        }
        if (emailProvider === 'sendgrid') {
            return !!this.configService.get('SENDGRID_API_KEY');
        }
        return !!(this.configService.get('SMTP_USER') &&
            this.configService.get('SMTP_PASSWORD'));
    }
    /**
     * Get password reset URL based on environment
     */
    getPasswordResetUrl(resetToken) {
        const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:8081');
        return `${frontendUrl}/reset-password?token=${resetToken}`;
    }
    getInviteUrl(inviteToken) {
        const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:8081');
        return `${frontendUrl}/accept-invite?token=${inviteToken}`;
    }
    getEmailVerificationUrl(token, backendPublicUrlOverride) {
        const backendUrl = backendPublicUrlOverride ||
            this.configService.get('BACKEND_PUBLIC_URL', 'http://localhost:3000');
        return `${backendUrl}/api/auth/verify-email?token=${token}`;
    }
    /**
     * HTML email template for password reset
     */
    getPasswordResetEmailTemplate(userName, resetUrl, appName) {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #5B21B6 0%, #4C1D95 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 700;">${appName}</h1>
  </div>
  
  <div style="background: #FFFFFF; padding: 40px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #111827; margin-top: 0; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
    
    <p style="color: #374151; font-size: 16px;">Hi ${userName},</p>
    
    <p style="color: #374151; font-size: 16px;">
      We received a request to reset your password for your ${appName} account. 
      Click the button below to create a new password:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" 
         style="display: inline-block; background: linear-gradient(135deg, #5B21B6 0%, #4C1D95 100%); 
                color: #FFFFFF; padding: 14px 32px; text-decoration: none; 
                border-radius: 8px; font-weight: 600; font-size: 16px;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="color: #5B21B6; font-size: 14px; word-break: break-all;">
      ${resetUrl}
    </p>
    
    <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
      This link will expire in 1 hour. If you didn't request a password reset, 
      you can safely ignore this email.
    </p>
    
    <p style="color: #374151; font-size: 16px; margin-top: 40px;">
      Best regards,<br>
      The ${appName} Team
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #6B7280; font-size: 12px;">
    <p>This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
    `.trim();
    }
    /**
     * Plain text email template for password reset
     */
    getPasswordResetEmailTextTemplate(userName, resetUrl, appName) {
        return `
Hi ${userName},

We received a request to reset your password for your ${appName} account.

Click the following link to create a new password:
${resetUrl}

This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.

Best regards,
The ${appName} Team

---
This is an automated message. Please do not reply to this email.
    `.trim();
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map