# 🧪 StewiePay Testing Instructions

## Quick Start

### 1. Install Dependencies
```bash
cd apps/mobile
yarn install
```

This will install:
- Tamagui packages
- All existing dependencies
- StewiePay brand components

### 2. Start the App
```bash
# From apps/mobile directory
yarn start

# Then press:
# - 'i' for iOS Simulator
# - 'a' for Android Emulator
```

### 3. Login
Use existing credentials or create a new account.

## What to Test

### 🏠 Home Screen
**What to look for:**
- ✅ Deep black background (`#000000`)
- ✅ Large, bold "Hey [Name]!" greeting
- ✅ StewiePay tagline: "Spend with Control, Live with Freedom"
- ✅ Beautiful gradient payment card (if you have cards)
- ✅ Monthly spend progress bar with colors
- ✅ Stats cards showing Active Cards and Total Spend
- ✅ Weekly spending chart (if data available)
- ✅ Smooth animations when scrolling
- ✅ FAB button (floating action button) in bottom right

**Test actions:**
1. Pull down to refresh
2. Tap on a card (should navigate to card detail)
3. Tap FAB button (should navigate to create card)
4. Scroll through the content

### 📊 Transactions Screen
**What to look for:**
- ✅ Clean header with transaction count
- ✅ Search bar with icon
- ✅ Category filter chips (horizontal scroll)
- ✅ Transaction cards with:
  - Category icons
  - Merchant names
  - Amounts (white for negative, cyan for positive)
  - Status badges (✓ for settled)
  - Relative timestamps
- ✅ Empty state when no transactions

**Test actions:**
1. Search for a merchant
2. Filter by category
3. Pull to refresh
4. Tap a transaction (should show detail)

### 💳 Cards Screen
**What to look for:**
- ✅ Header with card count
- ✅ Beautiful gradient payment cards
- ✅ Card info showing type and status
- ✅ Status badges with colors:
  - Green for ACTIVE
  - Yellow for FROZEN
  - Red for CANCELLED
- ✅ FAB button to create new card
- ✅ Empty state with create button

**Test actions:**
1. Tap a card (should navigate to detail)
2. Pull to refresh
3. Tap FAB to create card
4. Check status indicators

## Visual Quality Checklist

### Brand Consistency
- [ ] All backgrounds are deep black (`#000000`)
- [ ] All cards use dark gray (`#1A1A1A`)
- [ ] Text is white/light gray for readability
- [ ] Brand colors (purple `#667EEA`, cyan `#00D9FF`) used consistently
- [ ] Gradients look premium and smooth

### Typography
- [ ] Headers are large and bold (32px+)
- [ ] Body text is readable (16px)
- [ ] Amounts are prominent and bold
- [ ] Labels are smaller and muted

### Spacing
- [ ] Cards have proper padding
- [ ] Elements don't feel cramped
- [ ] Consistent spacing throughout

### Animations
- [ ] Cards fade in smoothly
- [ ] Pull to refresh works
- [ ] Button presses have haptic feedback
- [ ] No janky animations

## Common Issues & Fixes

### Issue: "Cannot find module 'tamagui'"
**Fix:** Run `yarn install` in `apps/mobile`

### Issue: "Cannot find module 'react-native-paper'"
**Fix:** This is expected for old screens. New screens don't use Paper.

### Issue: App crashes on startup
**Fix:** 
1. Clear Metro cache: `yarn start --clear`
2. Check that backend is running
3. Check console for specific errors

### Issue: Cards don't show gradients
**Fix:** Make sure `expo-linear-gradient` is installed

### Issue: Icons don't show
**Fix:** Make sure `@expo/vector-icons` is installed

## What's Working vs What's Not

### ✅ Working (New StewiePay Screens)
- HomeScreenStewie
- TransactionsScreenStewie
- CardsScreenStewie

### ⚠️ Still Using Old Design (Will be rebuilt)
- AnalyticsScreenPremium
- SubscriptionsScreenPremium
- BudgetsScreenPremium
- TopUpScreenPremium
- CreateCardScreenPremium
- LoginScreenPremium
- SignupScreenPremium
- OnboardingScreen

## Feedback to Provide

When testing, note:
1. **Visual issues** - Colors, spacing, typography
2. **Performance** - Animations, scrolling smoothness
3. **Functionality** - Buttons, navigation, data loading
4. **Brand feel** - Does it feel premium? Does it match StewiePay identity?
5. **Bugs** - Any crashes, errors, or unexpected behavior

## Next Steps After Testing

Once you've tested, we'll:
1. Fix any issues you find
2. Rebuild remaining screens
3. Add final polish and animations
4. Ensure 100% brand consistency

---

**Remember:** The goal is a beautiful, premium fintech app that feels alive and modern, not "dead" like before! 🚀













