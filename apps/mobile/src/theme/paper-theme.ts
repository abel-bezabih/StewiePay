import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// Premium dark theme for StewiePay (Revolut/Wise style)
export const paperDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#60A5FA', // Electric blue accent
    primaryContainer: '#1E3A5F',
    secondary: '#764BA2',
    secondaryContainer: '#3D2A54',
    tertiary: '#F5576C',
    surface: '#111827', // Card background
    surfaceVariant: '#1F2937', // Elevated surfaces
    background: '#0B1224', // Main background
    error: '#EF4444',
    errorContainer: '#7F1D1D',
    onPrimary: '#0B1224',
    onPrimaryContainer: '#DBEAFE',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#E9D5FF',
    onSurface: '#E2E8F0', // Primary text
    onSurfaceVariant: '#94A3B8', // Muted text
    onBackground: '#E2E8F0',
    onError: '#FFFFFF',
    outline: '#374151', // Borders
    outlineVariant: '#1F2937',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#E2E8F0',
    inverseOnSurface: '#1F2937',
    inversePrimary: '#3B82F6',
    elevation: {
      level0: 'transparent',
      level1: '#111827',
      level2: '#1F2937',
      level3: '#374151',
      level4: '#4B5563',
      level5: '#6B7280'
    }
  },
  roundness: 16
};

export const paperLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#3B82F6',
    primaryContainer: '#DBEAFE',
    secondary: '#764BA2',
    secondaryContainer: '#E9D5FF',
    tertiary: '#F5576C',
    surface: '#FFFFFF',
    surfaceVariant: '#F3F4F6',
    background: '#F9FAFB',
    error: '#EF4444',
    errorContainer: '#FEE2E2',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#1E3A5F',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#3D2A54',
    onSurface: '#111827',
    onSurfaceVariant: '#6B7280',
    onBackground: '#111827',
    onError: '#FFFFFF',
    outline: '#D1D5DB',
    outlineVariant: '#E5E7EB',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#1F2937',
    inverseOnSurface: '#F9FAFB',
    inversePrimary: '#60A5FA',
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#F9FAFB',
      level3: '#F3F4F6',
      level4: '#E5E7EB',
      level5: '#D1D5DB'
    }
  },
  roundness: 16
};







