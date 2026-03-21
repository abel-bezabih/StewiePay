import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Animated as RNAnimated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate } from 'react-native-reanimated';
import { StewiePayBrand } from '../../brand/StewiePayBrand';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

/**
 * Modern Skeleton Loader with Shimmer Effect
 * 
 * Features:
 * - Smooth shimmer animation using expo-linear-gradient
 * - Customizable shapes
 * - Brand-aligned colors
 * - No external dependencies beyond Expo
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = StewiePayBrand.radius.md,
  style,
  children,
}) => {
  const shimmer = useSharedValue(0);
  const sizeStyle = { width, height, borderRadius } as ViewStyle;

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            shimmer.value,
            [0, 1],
            [-200, 200]
          ),
        },
      ],
    };
  });

  if (children) {
    return (
      <View style={[styles.container, sizeStyle, style]}>
        <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius }]}>
          <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
            <LinearGradient
              colors={[
                StewiePayBrand.colors.surface,
                StewiePayBrand.colors.surfaceElevated,
                StewiePayBrand.colors.surface,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.skeleton, sizeStyle, style]}>
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius }]}>
        <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
          <LinearGradient
            colors={[
              StewiePayBrand.colors.surface,
              StewiePayBrand.colors.surfaceElevated,
              StewiePayBrand.colors.surface,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
};

/**
 * Pre-built Skeleton Components
 */
export const SkeletonCard = () => (
  <View style={styles.cardSkeleton}>
    <View style={styles.cardHeader}>
      <SkeletonLoader width={48} height={48} borderRadius={StewiePayBrand.radius.full} />
      <View style={styles.headerText}>
        <SkeletonLoader width="60%" height={16} borderRadius={StewiePayBrand.radius.sm} style={{ marginBottom: StewiePayBrand.spacing.xs }} />
        <SkeletonLoader width="40%" height={12} borderRadius={StewiePayBrand.radius.sm} />
      </View>
    </View>
    <View style={styles.cardBody}>
      <SkeletonLoader width="100%" height={14} borderRadius={StewiePayBrand.radius.sm} style={{ marginBottom: StewiePayBrand.spacing.xs }} />
      <SkeletonLoader width="70%" height={14} borderRadius={StewiePayBrand.radius.sm} />
    </View>
  </View>
);

export const SkeletonList = ({ count = 3 }: { count?: number }) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <View key={index} style={{ marginBottom: StewiePayBrand.spacing.md }}>
        <SkeletonCard />
      </View>
    ))}
  </>
);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: StewiePayBrand.colors.surface,
  },
  skeleton: {
    overflow: 'hidden',
    backgroundColor: StewiePayBrand.colors.surface,
  },
  cardSkeleton: {
    padding: StewiePayBrand.spacing.md,
    borderRadius: StewiePayBrand.radius.xl,
    backgroundColor: StewiePayBrand.colors.surface,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: StewiePayBrand.spacing.md,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: StewiePayBrand.spacing.md,
  },
  cardBody: {
    marginTop: StewiePayBrand.spacing.sm,
  },
});

