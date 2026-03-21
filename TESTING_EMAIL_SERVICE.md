# Testing Email Service Guide

## Prerequisites

1. **Configure Email Credentials** in `apps/backend/.env`:
   ```bash
   EMAIL_PROVIDER="gmail"
   EMAIL_FROM="your-email@gmail.com"
   GMAIL_USER="your-email@gmail.com"
   GMAIL_APP_PASSWORD="your-16-char-app-password"
   FRONTEND_URL="http://localhost:8081"
   ```

2. **Get Gmail App Password** (if using Gmail):
   - Go to: https://myaccount.google.com/apppasswords
   - Click "Select app" → Choose "Mail"
   - Click "Select device" → Choose "Other (Custom name)" → Enter "StewiePay Backend"
   - Click "Generate"
   - Copy the 16-character password (no spaces) into `.env`

3. **Restart Backend** after updating `.env`:
   ```bash
   cd apps/backend
   yarn start:dev
   ```

---

## Testing Steps

### Test 1: Forgot Password Flow (Full End-to-End)

#### Step 1: Start Both Apps
```bash
# Terminal 1: Backend
cd apps/backend
yarn start:dev

# Terminal 2: Mobile
cd apps/mobile
yarn start
```

#### Step 2: Use the Forgot Password Screen
1. **Open the mobile app** on your device/simulator
2. **Go to Login Screen** (if not already there)
3. **Tap "Forgot Password?"** link at the bottom
4. **Enter your registered email address**
5. **Tap "Send Reset Link"** button

#### Step 3: Check Email
- **Check your inbox** for an email from StewiePay
- **Subject:** "Reset Your Password"
- **Contains:** A purple "Reset Password" button
- **Link format:** `http://localhost:8081/reset-password?token=...`

#### Step 4: Test Reset Password (if reset screen exists)
- Click the reset link (or copy token)
- Enter new password
- Try logging in with new password

---

### Test 2: Backend API Direct Testing

#### Using curl:
```bash
# Test forgot password endpoint
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@gmail.com"}'
```

#### Expected Response:
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

#### Check Backend Logs:
You should see:
```
[EmailService] ✓ Password reset email sent to: your-email@gmail.com
```

---

### Test 3: Error Scenarios

#### Test Missing Credentials:
1. Remove `GMAIL_APP_PASSWORD` from `.env`
2. Restart backend
3. Try forgot password flow
4. **Expected:** Clear error message indicating missing credentials

#### Test Invalid Credentials:
1. Set wrong `GMAIL_APP_PASSWORD` in `.env`
2. Restart backend
3. Try forgot password flow
4. **Expected:** Error about invalid credentials

#### Test Invalid Email:
1. Enter non-existent email in forgot password screen
2. **Expected:** Same success message (security: don't reveal if email exists)

---

### Test 4: Development Mode Features

In development mode (`__DEV__ === true`), the mobile app may show:
- Reset token in an alert (for testing without email)
- Console logs with token details

Check the `ForgotPasswordScreen.tsx` for dev-only features.

---

## Troubleshooting

### Issue: "Missing credentials for PLAIN"
**Solution:** Check that all email env variables are set in `.env`:
- `EMAIL_PROVIDER`
- `GMAIL_USER` (or `SMTP_USER`)
- `GMAIL_APP_PASSWORD` (or `SMTP_PASSWORD`)

### Issue: "Failed to connect to email server"
**Solution:** 
- Check internet connection
- Verify SMTP settings (if not using Gmail)
- Check firewall/network restrictions

### Issue: Email not received
**Solutions:**
- Check spam folder
- Verify email address is correct
- Check backend logs for errors
- Ensure email provider allows sending from your IP

### Issue: Token expires immediately
**Solution:** Token expires in 1 hour. Check system time is correct.

---

## Success Criteria

✅ Email is sent successfully  
⚠️ **Note:** In development, use a real email address (Gmail, Yahoo, etc.) for testing. The email service works correctly, but you need a valid recipient domain. Once you have production DNS setup for `stewiepay.com`, emails to `@stewiepay.com` addresses will work.  
✅ Email arrives in inbox (not spam)  
✅ Email contains properly formatted reset link  
✅ Reset link works (when reset screen is implemented)  
✅ Clear error messages when credentials are missing  
✅ Backend logs show success/error messages

## Development Testing Notes

**Important:** When testing with Gmail as the sender:
- ✅ Use a **real email address** you control (Gmail, Yahoo, Outlook, etc.) as the recipient
- ✅ The email service successfully sends emails (as evidenced by Gmail's delivery attempt)
- ⚠️ Email addresses using `@stewiepay.com` won't work until DNS is configured in production
- ✅ Backend logs show: `[EmailService] ✓ Password reset email sent to: ...` (this confirms it's working)  

---

## Next Steps After Testing

Once email service is confirmed working:
1. ✅ Implement password reset screen in mobile app
2. ✅ Handle deep linking for reset password URLs
3. ✅ Add email verification for new signups (optional)
4. ✅ Add welcome email (optional)

