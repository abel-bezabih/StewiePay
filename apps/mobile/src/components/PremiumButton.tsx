import React from 'react';
import { TouchableOpacity, StyleSheet, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate
} from 'react-native-reanimated';
import { Text } from 'react-native';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import * as Haptics from 'expo-haptics';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface PremiumButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: any;
}

/**
 * Premium button with Revolut/Wise-level micro-interactions
 * - Spring animations on press
 * - Haptic feedback
 * - Loading states
 * - Success animations
 */
export const PremiumButton: React.FC<PremiumButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  fullWidth = false,
  style
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(disabled ? 0.5 : 1);
  const successScale = useSharedValue(1);

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, {
        damping: 15,
        stiffness: 300
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300
      });
    }
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      // Success animation
      successScale.value = withSequence(
        withTiming(1.05, { duration: 100 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value * successScale.value }
      ],
      opacity: opacity.value
    };
  });

  const getGradient = () => {
    switch (variant) {
      case 'primary':
        return StewiePayBrand.colors.gradients.primary;
      case 'secondary':
        return StewiePayBrand.colors.gradients.secondary;
      case 'accent':
        return StewiePayBrand.colors.gradients.accent;
      case 'success':
        return StewiePayBrand.colors.gradients.success;
      default:
        return StewiePayBrand.colors.gradients.primary;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 10, paddingHorizontal: 20, fontSize: 14, height: 40 };
      case 'lg':
        return { paddingVertical: 18, paddingHorizontal: 32, fontSize: 18, height: 56 };
      default:
        return { paddingVertical: 14, paddingHorizontal: 24, fontSize: 16, height: 48 };
    }
  };

  const sizeStyles = getSizeStyles();

  if (variant === 'outline') {
    return (
      <AnimatedTouchable
        style={[
          styles.outlineButton,
          { width: fullWidth ? '100%' : 'auto', height: sizeStyles.height },
          animatedStyle,
          style
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <View style={[styles.outlineContent, { paddingHorizontal: sizeStyles.paddingHorizontal }]}>
          {loading ? (
            <ActivityIndicator size="small" color={StewiePayBrand.colors.primary} />
          ) : (
            <>
              {icon && <Text style={styles.icon}>{icon}</Text>}
              <Text style={[styles.outlineLabel, { fontSize: sizeStyles.fontSize }]}>
                {label}
              </Text>
            </>
          )}
        </View>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      style={[
        styles.button,
        { width: fullWidth ? '100%' : 'auto', height: sizeStyles.height },
        animatedStyle,
        style
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
    >
      <LinearGradient
        colors={getGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { paddingHorizontal: sizeStyles.paddingHorizontal }]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            {icon && <Text style={styles.icon}>{icon}</Text>}
            <Text style={[styles.label, { fontSize: sizeStyles.fontSize }]}>
              {label}
            </Text>
          </>
        )}
      </LinearGradient>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: StewiePayBrand.radius.lg,
    overflow: 'hidden',
    ...StewiePayBrand.shadows.md
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: StewiePayBrand.radius.lg,
    flex: 1
  },
  outlineButton: {
    borderRadius: StewiePayBrand.radius.lg,
    borderWidth: 2,
    borderColor: StewiePayBrand.colors.primary,
    backgroundColor: 'transparent'
  },
  outlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
    letterSpacing: 0.5
  },
  outlineLabel: {
    color: StewiePayBrand.colors.primary,
    fontWeight: '700' as const,
    letterSpacing: 0.5
  },
  icon: {
    fontSize: 20,
    marginRight: StewiePayBrand.spacing.sm,
    color: '#FFFFFF'
  }
});




