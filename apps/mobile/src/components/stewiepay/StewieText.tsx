import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { StewiePayBrand } from '../../brand/StewiePayBrand';

type TextVariant = 
  | 'displayLarge'
  | 'displayMedium'
  | 'displaySmall'
  | 'headlineLarge'
  | 'headlineMedium'
  | 'headlineSmall'
  | 'titleLarge'
  | 'titleMedium'
  | 'titleSmall'
  | 'bodyLarge'
  | 'bodyMedium'
  | 'bodySmall'
  | 'labelLarge'
  | 'labelMedium'
  | 'labelSmall';

interface StewieTextProps extends TextProps {
  variant?: TextVariant;
  color?: 'primary' | 'secondary' | 'muted' | 'brand' | 'success' | 'error' | 'warning';
  weight?: 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
}

/**
 * StewieText - Typography component with StewiePay brand styles
 * 
 * Ensures consistent typography throughout the app with brand-aligned
 * font sizes, weights, and colors.
 */
export const StewieText: React.FC<StewieTextProps> = ({
  variant = 'bodyMedium',
  color = 'primary',
  weight,
  style,
  children,
  ...props
}) => {
  const variantStyle = StewiePayBrand.typography.styles[variant];
  const colorValue = getColorValue(color);
  const weightValue = weight 
    ? StewiePayBrand.typography.fontWeight[weight] as '300' | '400' | '500' | '600' | '700' | '800' | '900'
    : (variantStyle.fontWeight as '300' | '400' | '500' | '600' | '700' | '800' | '900');

  // Create a style object with proper types
  const baseStyle = {
    ...variantStyle,
    fontWeight: weightValue,
    color: colorValue,
  } as const;

  return (
    <Text
      style={[baseStyle, style]}
      {...props}
    >
      {children}
    </Text>
  );
};

function getColorValue(color: string): string {
  switch (color) {
    case 'primary':
      return StewiePayBrand.colors.textPrimary;
    case 'secondary':
      return StewiePayBrand.colors.textSecondary;
    case 'muted':
      return StewiePayBrand.colors.textMuted;
    case 'brand':
      return StewiePayBrand.colors.primary;
    case 'success':
      return StewiePayBrand.colors.success;
    case 'error':
      return StewiePayBrand.colors.error;
    case 'warning':
      return StewiePayBrand.colors.warning;
    default:
      return StewiePayBrand.colors.textPrimary;
  }
}




