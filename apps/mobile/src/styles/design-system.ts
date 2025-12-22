/**
 * StewiePay Design System
 * Clean, native-feeling design tokens
 */

export const colors = {
  // Backgrounds - Deep Black like Revolut
  bg: {
    primary: '#000000',
    secondary: '#0A0A0A',
    card: '#1A1A1A',
    elevated: '#2A2A2A',
  },
  // Text Colors
  text: {
    primary: '#FFFFFF',
    secondary: '#CCCCCC',
    muted: '#999999',
  },
  // Brand Colors
  brand: {
    primary: '#5B21B6', // Deep purple
    secondary: '#00D4FF',
    accent: '#F093FB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const typography = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  base: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 18, lineHeight: 26 },
  xl: { fontSize: 20, lineHeight: 28 },
  '2xl': { fontSize: 24, lineHeight: 32 },
  '3xl': { fontSize: 30, lineHeight: 38 },
  '4xl': { fontSize: 36, lineHeight: 44 },
  '5xl': { fontSize: 48, lineHeight: 56 },
};

export const fontWeight = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};





