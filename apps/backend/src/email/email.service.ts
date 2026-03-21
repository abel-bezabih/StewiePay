import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Configure email transporter
    // Support multiple providers: Gmail, SendGrid, AWS SES, or SMTP
    const emailProvider = this.configService.get<string>('EMAIL_PROVIDER', 'smtp');
    
    if (emailProvider === 'sendgrid') {
      // SendGrid configuration
      const sendgridKey = this.configService.get<string>('SENDGRID_API_KEY');
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
    } else if (emailProvider === 'gmail') {
      // Gmail configuration
      const gmailUser = this.configService.get<string>('GMAIL_USER');
      const gmailPassword = this.configService.get<string>('GMAIL_APP_PASSWORD');
      
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
    } else {
      // Generic SMTP configuration
      const smtpHost = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
      const smtpPort = Number(this.configService.get<string>('SMTP_PORT', '587'));
      const smtpSecure = this.configService.get<string>('SMTP_SECURE', 'false') === 'true';
      const smtpUser = this.configService.get<string>('SMTP_USER');
      const smtpPassword = this.configService.get<string>('SMTP_PASSWORD');
      
      if (!smtpUser || !smtpPassword) {
        console.warn('[EmailService] SMTP credentials not configured. Email sending will fail.');
        console.warn('[EmailService] Please set SMTP_USER and SMTP_PASSWORD in your .env file.');
        console.warn('[EmailService] Or set EMAIL_PROVIDER="gmail" with GMAIL_USER and GMAIL_APP_PASSWORD.');
      }
      
      // Only include auth if credentials are provided
      const smtpConfig: any = {
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
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName?: string,
  ): Promise<void> {
    if (!this.hasEmailCredentials()) {
      const errorMsg = `Email credentials not configured. Please set up email in your .env file. See apps/backend/EMAIL_SETUP.md for instructions.`;
      console.error(`[EmailService] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    const resetUrl = this.getPasswordResetUrl(resetToken);
    const fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@stewiepay.com');
    const appName = 'StewiePay';

    const htmlContent = this.getPasswordResetEmailTemplate(
      userName || 'User',
      resetUrl,
      appName,
    );

    const textContent = this.getPasswordResetEmailTextTemplate(
      userName || 'User',
      resetUrl,
      appName,
    );

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
    } catch (error: any) {
      const errorDetails = error.message || 'Unknown error';
      console.error('[EmailService] Failed to send password reset email:', errorDetails);
      
      // Provide more helpful error messages
      if (errorDetails.includes('Missing credentials') || errorDetails.includes('Invalid login')) {
        throw new Error('Email credentials are invalid or missing. Please check your .env file configuration.');
      } else if (errorDetails.includes('timeout') || errorDetails.includes('ECONNREFUSED')) {
        throw new Error('Could not connect to email server. Please check your SMTP settings.');
      } else {
        throw new Error(`Failed to send password reset email: ${errorDetails}`);
      }
    }
  }

  /**
   * Send organization invite email
   */
  async sendOrganizationInviteEmail(
    email: string,
    inviteToken: string,
    orgName: string,
    inviterName?: string
  ): Promise<void> {
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
    const fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@stewiepay.com');
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
    } catch (error: any) {
      const errorDetails = error.message || 'Unknown error';
      console.error('[EmailService] Failed to send invite email:', errorDetails);
      throw new Error(`Failed to send invite email: ${errorDetails}`);
    }
  }

  async sendEmailVerificationEmail(
    email: string,
    verificationToken: string,
    userName?: string,
    backendPublicUrlOverride?: string
  ): Promise<void> {
    if (!this.hasEmailCredentials()) {
      const errorMsg = `Email credentials not configured. Please set up email in your .env file. See apps/backend/EMAIL_SETUP.md for instructions.`;
      console.error(`[EmailService] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const verifyUrl = this.getEmailVerificationUrl(verificationToken, backendPublicUrlOverride);
    const fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@stewiepay.com');
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

  private hasEmailCredentials(): boolean {
    const emailProvider = this.configService.get<string>('EMAIL_PROVIDER', 'smtp');
    if (emailProvider === 'gmail') {
      return !!(
        this.configService.get<string>('GMAIL_USER') &&
        this.configService.get<string>('GMAIL_APP_PASSWORD')
      );
    }
    if (emailProvider === 'sendgrid') {
      return !!this.configService.get<string>('SENDGRID_API_KEY');
    }
    return !!(
      this.configService.get<string>('SMTP_USER') &&
      this.configService.get<string>('SMTP_PASSWORD')
    );
  }

  /**
   * Get password reset URL based on environment
   */
  private getPasswordResetUrl(resetToken: string): string {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:8081',
    );
    return `${frontendUrl}/reset-password?token=${resetToken}`;
  }

  private getInviteUrl(inviteToken: string): string {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:8081',
    );
    return `${frontendUrl}/accept-invite?token=${inviteToken}`;
  }

  private getEmailVerificationUrl(token: string, backendPublicUrlOverride?: string): string {
    const backendUrl =
      backendPublicUrlOverride ||
      this.configService.get<string>('BACKEND_PUBLIC_URL', 'http://localhost:3000');
    return `${backendUrl}/api/auth/verify-email?token=${token}`;
  }

  /**
   * HTML email template for password reset
   */
  private getPasswordResetEmailTemplate(
    userName: string,
    resetUrl: string,
    appName: string,
  ): string {
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
  private getPasswordResetEmailTextTemplate(
    userName: string,
    resetUrl: string,
    appName: string,
  ): string {
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
}


