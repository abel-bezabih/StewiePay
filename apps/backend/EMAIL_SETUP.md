# Email Service Setup Guide

## Quick Setup (Gmail - Recommended for Testing)

### Step 1: Create `.env` file
Copy `env.example` to `.env`:
```bash
cd apps/backend
cp env.example .env
```

### Step 2: Enable 2-Step Verification
1. Go to your Google Account: https://myaccount.google.com/security
2. Enable **2-Step Verification** if not already enabled

### Step 3: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select **"Mail"** as the app
3. Select **"Other (Custom name)"** as the device
4. Enter "StewiePay" as the name
5. Click **"Generate"**
6. Copy the **16-character password** (it will look like: `abcd efgh ijkl mnop`)

### Step 4: Configure `.env` file
Open `apps/backend/.env` and update these lines:

```bash
# Email Service Configuration
EMAIL_PROVIDER="gmail"
EMAIL_FROM="your-email@gmail.com"  # Replace with your Gmail address

# Gmail Configuration
GMAIL_USER="your-email@gmail.com"  # Replace with your Gmail address
GMAIL_APP_PASSWORD="abcdefghijklmnop"  # Paste the 16-char password (no spaces)
```

**Important:** 
- Remove any spaces from the app password
- Use the full Gmail address (e.g., `yourname@gmail.com`)

### Step 5: Test the Configuration
1. Start your backend: `cd apps/backend && yarn start:dev`
2. Look for this message in the console:
   - ✅ `[EmailService] Email configuration verified` (success)
   - ⚠️ `[EmailService] Email configuration error: ...` (check your credentials)

### Step 6: Test Password Reset
1. Use the "Forgot Password" feature in your mobile app
2. Enter a registered email address
3. Check your email inbox for the password reset link

---

## Alternative: Generic SMTP Configuration

If you prefer to use SMTP instead of the Gmail provider:

```bash
EMAIL_PROVIDER="smtp"
EMAIL_FROM="your-email@gmail.com"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"  # Same Gmail App Password
```

---

## Alternative: SendGrid (Production)

For production, consider using SendGrid:

1. Sign up at: https://sendgrid.com
2. Create an API key
3. Configure in `.env`:

```bash
EMAIL_PROVIDER="sendgrid"
EMAIL_FROM="noreply@stewiepay.com"  # Must be verified in SendGrid
SENDGRID_API_KEY="SG.your-api-key-here"
```

---

## Troubleshooting

### "Invalid login" error
- Make sure you're using an **App Password**, not your regular Gmail password
- Verify 2-Step Verification is enabled
- Check that there are no spaces in the app password

### "Connection timeout" error
- Check your internet connection
- Verify SMTP settings (host, port)
- For Gmail, make sure "Less secure app access" is not required (use App Password instead)

### Email not received
- Check spam folder
- Verify `EMAIL_FROM` matches your Gmail address
- Check backend logs for error messages
- In development mode, the reset token is also returned in the API response for testing

---

## Development Mode

In development (`NODE_ENV=development`), the password reset API will:
- Send the email normally
- Also return the `resetToken` in the response for easy testing

This allows you to test the reset flow without checking email.



