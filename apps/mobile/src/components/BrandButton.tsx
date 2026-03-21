import React from 'react';
import { TouchableOpacity, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate
} from 'react-native-reanimated';
import { Text } from 'react-native';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import * as Haptics from 'expo-haptics';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface BrandButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const BrandButton: React.FC<BrandButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  fullWidth = false,
  style
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(disabled ? 0.5 : 1);

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.95, StewiePayBrand.animation.spring);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1, StewiePayBrand.animation.spring);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
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
      default:
        return StewiePayBrand.colors.gradients.primary;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 10, paddingHorizontal: 16, fontSize: 14 };
      case 'lg':
        return { paddingVertical: 18, paddingHorizontal: 32, fontSize: 18 };
      default:
        return { paddingVertical: 14, paddingHorizontal: 24, fontSize: 16 };
    }
  };

  const sizeStyles = getSizeStyles();

  if (variant === 'outline') {
    return (
      <AnimatedTouchable
        style={[styles.outlineButton, { width: fullWidth ? '100%' : 'auto' }, animatedStyle, style]}
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <View style={[styles.outlineContent, { paddingVertical: sizeStyles.paddingVertical, paddingHorizontal: sizeStyles.paddingHorizontal }]}>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={[styles.outlineLabel, { fontSize: sizeStyles.fontSize }]}>
            {label}
          </Text>
        </View>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      style={[styles.button, { width: fullWidth ? '100%' : 'auto' }, animatedStyle, style]}
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
    >
      <LinearGradient
        colors={getGradient() as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { paddingVertical: sizeStyles.paddingVertical, paddingHorizontal: sizeStyles.paddingHorizontal }]}
      >
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={[styles.label, { fontSize: sizeStyles.fontSize }]}>
          {label}
        </Text>
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
    borderRadius: StewiePayBrand.radius.lg
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
    justifyContent: 'center'
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






