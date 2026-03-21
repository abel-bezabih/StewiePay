import React from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StewiePayBrand } from '../../brand/StewiePayBrand';
import { StewieText } from './StewieText';
import * as Haptics from 'expo-haptics';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface StewieButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * StewieButton - Premium button component with StewiePay branding
 * 
 * Features:
 * - Multiple variants (primary, secondary, outline, ghost)
 * - Gradient support for primary variant
 * - Haptic feedback
 * - Loading states
 * - Consistent sizing and spacing
 */
export const StewieButton: React.FC<StewieButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const buttonStyle = [
    styles.button,
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const content = (
    <>
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? '#FFFFFF' : StewiePayBrand.colors.primary} 
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <StewieText
            variant="labelLarge"
            weight="semibold"
            color={getTextColor(variant)}
            style={[
              variant === 'primary' && { color: '#FFFFFF' },
              icon ? { marginLeft: StewiePayBrand.spacing.sm } : undefined
            ]}
          >
            {label}
          </StewieText>
        </>
      )}
    </>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={buttonStyle}
      >
        <LinearGradient
          colors={StewiePayBrand.colors.gradients.primary as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.buttonContent}>
          {content}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        buttonStyle,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
      ]}
    >
      {content}
    </TouchableOpacity>
  );
};

function getTextColor(variant: ButtonVariant): 'primary' | 'brand' {
  if (variant === 'primary') return 'brand'; // Primary buttons use white text (overridden with style)
  return 'brand';
}

const styles = StyleSheet.create({
  button: {
    borderRadius: StewiePayBrand.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: {
    paddingVertical: StewiePayBrand.spacing.sm,
    paddingHorizontal: StewiePayBrand.spacing.md,
  },
  md: {
    paddingVertical: StewiePayBrand.spacing.md,
    paddingHorizontal: StewiePayBrand.spacing.lg,
  },
  lg: {
    paddingVertical: StewiePayBrand.spacing.lg,
    paddingHorizontal: StewiePayBrand.spacing.xl,
  },
  fullWidth: {
    width: '100%',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: StewiePayBrand.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
});

