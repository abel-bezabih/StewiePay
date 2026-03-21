# 🔧 Setting Up Environment Variables

## Problem
Backend shows error: `Environment variable not found: DATABASE_URL`

## Solution

### Option 1: Create .env File (Recommended)

Create a file at `/Users/user/Desktop/StewiePay/apps/backend/.env` with this content:

```bash
# Database
DATABASE_URL="postgresql://stewie:stewiepassword@localhost:5432/stewiepay"

# Auth
JWT_SECRET="changeme-dev-secret"
JWT_EXPIRES_IN="15m"
BCRYPT_SALT_ROUNDS="10"
REFRESH_TOKEN_TTL_DAYS="30"

# Issuer / PSP placeholders
ISSUER_API_KEY="issuer-api-key"
ISSUER_BASE_URL="https://issuer-sandbox.example.com"
PSP_API_KEY="psp-api-key"
PSP_BASE_URL="https://psp-sandbox.example.com"
PSP_WEBHOOK_SECRET="psp-webhook-secret"
```

**Quick command to create it:**
```bash
cd /Users/user/Desktop/StewiePay/apps/backend
cat > .env << 'EOF'
DATABASE_URL="postgresql://stewie:stewiepassword@localhost:5432/stewiepay"
JWT_SECRET="changeme-dev-secret"
JWT_EXPIRES_IN="15m"
BCRYPT_SALT_ROUNDS="10"
REFRESH_TOKEN_TTL_DAYS="30"
ISSUER_API_KEY="issuer-api-key"
ISSUER_BASE_URL="https://issuer-sandbox.example.com"
PSP_API_KEY="psp-api-key"
PSP_BASE_URL="https://psp-sandbox.example.com"
PSP_WEBHOOK_SECRET="psp-webhook-secret"
EOF
```

### Option 2: Set Environment Variable When Running

```bash
cd /Users/user/Desktop/StewiePay/apps/backend
DATABASE_URL="postgresql://stewie:stewiepassword@localhost:5432/stewiepay" yarn start
```

## After Creating .env

1. **Restart the backend:**
   ```bash
   yarn workspace @stewiepay/backend start
   ```

2. **Verify it works:**
   - Check backend logs - should see "Backend placeholder ready at..."
   - Try logging in from mobile app
   - Should work now!

## Important Notes

- `.env` file is gitignored (won't be committed)
- Use `env.example` as a template for other developers
- Never commit real secrets to git
- For production, use proper secret management (AWS Secrets Manager, etc.)

---

**Create the .env file and restart the backend - that will fix the DATABASE_URL error!** 🚀















