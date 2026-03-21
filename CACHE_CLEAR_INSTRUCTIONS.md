# 🔄 Clear Metro Cache - Fix Import Errors

If you're seeing errors about old files (like `CreateCardScreenPremium.tsx`), it's likely a Metro bundler cache issue.

## Quick Fix

```bash
cd apps/mobile

# Stop the current Metro bundler (Ctrl+C if running)

# Clear cache and restart
yarn start --clear

# Or if that doesn't work:
rm -rf node_modules/.cache
rm -rf .expo
yarn start --clear
```

## Nuclear Option (If Above Doesn't Work)

```bash
cd apps/mobile

# Stop Metro bundler
# Press Ctrl+C

# Clear everything
rm -rf node_modules
rm -rf .expo
rm -rf node_modules/.cache

# Reinstall
yarn install

# Start fresh
yarn start --clear
```

## What Was Fixed

✅ Deleted `CreateCardScreenPremium.tsx` (old file)
✅ Navigation updated to use `CreateCardScreenStewie.tsx`
✅ All new screens use StewiePay branding (no react-native-paper)

## Current StewiePay Screens

- ✅ LoginScreenStewie
- ✅ SignupScreenStewie  
- ✅ HomeScreenStewie
- ✅ TransactionsScreenStewie
- ✅ CardsScreenStewie
- ✅ CreateCardScreenStewie

All these screens are **react-native-paper free** and use StewiePay branding!













