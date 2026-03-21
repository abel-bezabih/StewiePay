# 🔧 Fixing Login "Internal Server Error"

## Problem
The login screen shows "Internal server error" when trying to sign in.

## Root Cause
The most likely issue is that the **RefreshToken table doesn't exist** in your database. The login flow tries to create a refresh token, which fails if the table is missing.

## Solution

### Step 1: Check if migrations are up to date
```bash
cd /Users/user/Desktop/StewiePay/apps/backend
DATABASE_URL="postgresql://stewie:stewiepassword@localhost:5432/stewiepay" yarn prisma migrate status
```

### Step 2: Run all pending migrations
```bash
DATABASE_URL="postgresql://stewie:stewiepassword@localhost:5432/stewiepay" yarn prisma migrate dev
```

This will:
- Create the RefreshToken table (if missing)
- Add merchant lock fields to Card table
- Ensure all tables are up to date

### Step 3: Generate Prisma Client
```bash
yarn prisma generate
```

### Step 4: Restart the backend
```bash
yarn workspace @stewiepay/backend start
```

## What I Fixed

1. **Better Error Logging** 📝
   - Added console.error logs for unhandled exceptions
   - Error messages now show the actual error instead of generic "Internal server error"
   - Login/signup methods now catch and wrap errors properly

2. **Error Handling** 🛡️
   - `issueTokens()` now catches errors and provides clear messages
   - Login/signup methods have try-catch blocks
   - Errors are properly converted to HttpExceptions

## After Running Migrations

Once the migrations are complete:
1. The RefreshToken table will exist
2. Login should work properly
3. You'll see actual error messages instead of "Internal server error"

## Check Backend Logs

After restarting, check the backend terminal for error logs. You should now see:
- The actual error message
- Stack traces for debugging
- Clear indication of what's failing

---

**Run the migrations and restart the backend - that should fix the login error!** 🚀















