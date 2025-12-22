import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate
} from 'react-native-reanimated';
import { StewiePayBrand } from '../brand/StewiePayBrand';

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

/**
 * Premium loading skeleton with shimmer effect
 * Similar to Revolut's loading states
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style
}) => {
  const shimmer = useSharedValue(0);

  React.useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shimmer.value,
      [0, 0.5, 1],
      [0.3, 0.6, 0.3]
    );
    return {
      opacity
    };
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: StewiePayBrand.colors.surfaceVariant
        },
        animatedStyle,
        style
      ]}
    />
  );
};

interface CardSkeletonProps {
  style?: any;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ style }) => {
  return (
    <View style={[styles.cardSkeleton, style]}>
      <LoadingSkeleton width="60%" height={24} borderRadius={12} style={{ marginBottom: 16 }} />
      <LoadingSkeleton width="80%" height={32} borderRadius={16} style={{ marginBottom: 24 }} />
      <LoadingSkeleton width="40%" height={16} borderRadius={8} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: StewiePayBrand.colors.surfaceVariant
  },
  cardSkeleton: {
    padding: StewiePayBrand.spacing.lg,
    borderRadius: StewiePayBrand.radius.xl,
    backgroundColor: StewiePayBrand.colors.surface,
    margin: StewiePayBrand.spacing.lg
  }
});





