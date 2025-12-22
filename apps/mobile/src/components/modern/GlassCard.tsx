import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { StewiePayBrand } from '../../brand/StewiePayBrand';

// Try to import BlurView, fallback to View if not available
let BlurView: any;
try {
  BlurView = require('expo-blur').BlurView;
} catch {
  BlurView = View; // Fallback
}

interface GlassCardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  animated?: boolean;
}

/**
 * Modern Glassmorphic Card Component
 * 
 * Features:
 * - Frosted glass effect with blur
 * - Multi-layer shadows for depth
 * - Smooth animations
 * - Touch feedback
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  elevated = false,
  intensity = 50, // Optimized intensity for perfect blur visibility
  tint = 'light', // Light tint for elegant glass effect
  animated = true,
  onPress,
  ...touchableProps
}) => {
  const cardStyle = [
    styles.card,
    elevated && styles.elevated,
    style,
  ];

  const blurTint = tint === 'light' ? 'light' : tint === 'dark' ? 'dark' : 'light';

  const CardContent = (
    <View style={cardStyle}>
      {/* Blur Background */}
      <BlurView
        intensity={intensity}
        tint={blurTint}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Beautiful gradient overlay for elegance and depth - light gray theme */}
      <LinearGradient
        colors={[
          'rgba(203, 213, 225, 0.2)', 
          'rgba(209, 213, 219, 0.18)', 
          'rgba(229, 231, 235, 0.12)',
          'rgba(243, 244, 246, 0.08)' // Even more visible gray gradient
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Subtle primary color accent overlay */}
      <View style={styles.overlay} />
      
      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        {...touchableProps}
      >
        {animated ? (
          <Animated.View entering={FadeIn.duration(300)}>
            {CardContent}
          </Animated.View>
        ) : (
          CardContent
        )}
      </TouchableOpacity>
    );
  }

  return animated ? (
    <Animated.View entering={FadeIn.duration(300)}>
      {CardContent}
    </Animated.View>
  ) : (
    CardContent
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: StewiePayBrand.radius.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(209, 213, 219, 0.92)', // Even more visible light gray background
    borderWidth: 1.5,
    borderColor: 'rgba(156, 163, 175, 0.5)', // Even more visible light gray border
    // Beautiful glassmorphic appearance with light gray tint
    // Creates a premium, modern look with elegant contrast
  },
  elevated: {
    ...StewiePayBrand.shadows.lg,
    shadowColor: StewiePayBrand.colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 14,
    // Enhanced shadow for elevated cards
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(156, 163, 175, 0.1)', // Even more visible light gray tint
  },
  content: {
    padding: StewiePayBrand.spacing.md,
    position: 'relative',
    zIndex: 1,
  },
});

