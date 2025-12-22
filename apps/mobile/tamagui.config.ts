import { config } from '@tamagui/config/v3';
import { createTamagui } from 'tamagui';
import { StewiePayBrand } from './src/brand/stewiepay-brand';

// Customize Tamagui config with StewiePay brand colors
const tamaguiConfig = createTamagui({
  ...config,
  themes: {
    dark: {
      ...config.themes.dark,
      // StewiePay Brand Colors
      background: StewiePayBrand.colors.background,
      backgroundHover: StewiePayBrand.colors.backgroundSecondary,
      backgroundPress: StewiePayBrand.colors.surface,
      backgroundFocus: StewiePayBrand.colors.surface,
      
      color: StewiePayBrand.colors.textPrimary,
      colorHover: StewiePayBrand.colors.textSecondary,
      colorPress: StewiePayBrand.colors.textPrimary,
      colorFocus: StewiePayBrand.colors.textPrimary,
      
      borderColor: StewiePayBrand.colors.surfaceVariant,
      borderColorHover: StewiePayBrand.colors.surfaceElevated,
      borderColorPress: StewiePayBrand.colors.primary,
      borderColorFocus: StewiePayBrand.colors.primary,
      
      // Brand colors
      primary: StewiePayBrand.colors.primary,
      primaryHover: StewiePayBrand.colors.primaryLight,
      primaryPress: StewiePayBrand.colors.primaryDark,
      primaryFocus: StewiePayBrand.colors.primary,
      
      secondary: StewiePayBrand.colors.secondary,
      accent: StewiePayBrand.colors.accent,
      success: StewiePayBrand.colors.success,
      warning: StewiePayBrand.colors.warning,
      error: StewiePayBrand.colors.error,
    },
  },
  tokens: {
    ...config.tokens,
    // Override spacing with StewiePay brand spacing
    space: {
      ...config.tokens.space,
      xs: StewiePayBrand.spacing.xs,
      sm: StewiePayBrand.spacing.sm,
      md: StewiePayBrand.spacing.md,
      lg: StewiePayBrand.spacing.lg,
      xl: StewiePayBrand.spacing.xl,
      '2xl': StewiePayBrand.spacing['2xl'],
      '3xl': StewiePayBrand.spacing['3xl'],
    },
    // Override radius with StewiePay brand radius
    radius: {
      ...config.tokens.radius,
      sm: StewiePayBrand.radius.sm,
      md: StewiePayBrand.radius.md,
      lg: StewiePayBrand.radius.lg,
      xl: StewiePayBrand.radius.xl,
      '2xl': StewiePayBrand.radius['2xl'],
      full: StewiePayBrand.radius.full,
    },
  },
});

export default tamaguiConfig;

// TypeScript types
export type Conf = typeof tamaguiConfig;
declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

