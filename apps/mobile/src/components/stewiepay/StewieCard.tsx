import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { StewiePayBrand } from '../../brand/StewiePayBrand';
import { LinearGradient } from 'expo-linear-gradient';

interface StewieCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  gradient?: boolean;
  gradientColors?: [string, string, ...string[]];
  style?: ViewStyle;
  elevated?: boolean;
}

/**
 * StewieCard - Premium card component with StewiePay branding
 * 
 * Features:
 * - Deep black background with subtle elevation
 * - Optional gradient overlay
 * - Smooth press animations
 * - Consistent spacing and radius
 */
export const StewieCard: React.FC<StewieCardProps> = ({
  children,
  onPress,
  gradient = false,
  gradientColors,
  style,
  elevated = false,
}) => {
  const cardStyle = [
    styles.card,
    elevated && styles.elevated,
    style,
  ];

  const content = (
    <View style={cardStyle}>
      {gradient && (
        <LinearGradient
          colors={(gradientColors || StewiePayBrand.colors.gradients.primary) as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { opacity: 0.1 }]}
        />
      )}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: StewiePayBrand.colors.surface,
    borderRadius: StewiePayBrand.radius.lg,
    padding: StewiePayBrand.spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: StewiePayBrand.colors.surfaceVariant,
  },
  elevated: {
    ...StewiePayBrand.shadows.lg,
    borderWidth: 0,
  },
});




