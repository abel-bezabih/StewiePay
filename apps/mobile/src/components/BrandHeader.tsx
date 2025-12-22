import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { Text } from 'react-native';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface BrandHeaderProps {
  title: string;
  subtitle?: string;
  gradient?: 'primary' | 'secondary' | 'accent';
  showLogo?: boolean;
  animated?: boolean;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  title,
  subtitle,
  gradient = 'primary',
  showLogo = false,
  animated = true
}) => {
  const scale = useSharedValue(animated ? 0.9 : 1);
  const opacity = useSharedValue(animated ? 0 : 1);

  React.useEffect(() => {
    if (animated) {
      scale.value = withSpring(1, StewiePayBrand.animation.spring);
      opacity.value = withSpring(1, StewiePayBrand.animation.spring);
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value
    };
  });

  const gradientColors = StewiePayBrand.colors.gradients[gradient] || StewiePayBrand.colors.gradients.primary;

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Animated.View style={[styles.content, animatedStyle]}>
        {showLogo && (
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>💳</Text>
            <Text style={styles.brandName}>StewiePay</Text>
          </View>
        )}
        <Text style={styles.title}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
      </Animated.View>
      
      {/* Decorative Elements */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: StewiePayBrand.spacing.lg,
    paddingTop: 60,
    borderBottomLeftRadius: StewiePayBrand.radius['3xl'],
    borderBottomRightRadius: StewiePayBrand.radius['3xl'],
    overflow: 'hidden',
    position: 'relative'
  },
  content: {
    zIndex: 1
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: StewiePayBrand.spacing.md
  },
  logo: {
    fontSize: 32,
    marginRight: StewiePayBrand.spacing.sm
  },
  brandName: {
    fontSize: StewiePayBrand.typography.fontSize['2xl'],
    fontWeight: StewiePayBrand.typography.fontWeight.extrabold,
    color: '#FFFFFF',
    letterSpacing: 1
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '800' as const,
    fontSize: StewiePayBrand.typography.fontSize['2xl'],
    marginBottom: StewiePayBrand.spacing.xs
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: StewiePayBrand.typography.fontSize.base,
    marginTop: StewiePayBrand.spacing.xs
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -50,
    right: -50
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    bottom: -30,
    left: -30
  }
});






