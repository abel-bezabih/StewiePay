import React, { createContext, useContext } from 'react';
import { ColorValue } from 'react-native';

type Theme = {
  colors: {
    background: ColorValue;
    card: ColorValue;
    text: ColorValue;
    muted: ColorValue;
    accent: ColorValue;
    border: ColorValue;
    success: ColorValue;
    danger: ColorValue;
  };
  spacing: (multiplier: number) => number;
  radius: {
    sm: number;
    md: number;
    lg: number;
  };
};

const theme: Theme = {
  colors: {
    background: '#0A0A0A', // Darker than cards but not pure black
    card: '#111827',
    text: '#E2E8F0',
    muted: '#94A3B8',
    accent: '#60A5FA',
    border: '#1F2937',
    success: '#22C55E',
    danger: '#EF4444'
  },
  spacing: (m: number) => m * 4,
  radius: {
    sm: 8,
    md: 12,
    lg: 16
  }
};

const ThemeContext = createContext<Theme>(theme);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);











