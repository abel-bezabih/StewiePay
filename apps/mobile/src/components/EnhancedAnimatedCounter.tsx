import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { StewiePayBrand } from '../brand/StewiePayBrand';

interface EnhancedAnimatedCounterProps {
  value: number;
  duration?: number;
  style?: any;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  useSpring?: boolean;
  format?: 'number' | 'currency';
  currency?: string;
}

/**
 * Enhanced animated counter with Revolut-level smoothness
 * - Spring physics for natural motion
 * - Smooth number transitions
 * - Currency formatting
 * - Performance optimized
 */
export const EnhancedAnimatedCounter: React.FC<EnhancedAnimatedCounterProps> = ({
  value,
  duration = 1000,
  style,
  prefix = '',
  suffix = '',
  decimals = 0,
  useSpring = true,
  format = 'number',
  currency = 'ETB'
}) => {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animatedValue.value = useSpring
      ? withSpring(value, {
          damping: 15,
          stiffness: 100,
          mass: 1
        })
      : withTiming(value, { duration });
  }, [value, duration, useSpring]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayValue((prev) => {
        const target = animatedValue.value;
        const diff = target - prev;
        if (Math.abs(diff) < 0.01) return target;
        return prev + diff * 0.15;
      });
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      animatedValue.value,
      [value * 0.9, value],
      [1, 1.05],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ scale }]
    };
  });

  const formatValue = (val: number): string => {
    if (format === 'currency') {
      return `${currency} ${val.toFixed(decimals).toLocaleString()}`;
    }
    return val.toFixed(decimals).toLocaleString();
  };

  return (
    <Animated.Text
      style={[
        styles.text,
        {
          color: StewiePayBrand.colors.onSurface,
          fontWeight: StewiePayBrand.typography.fontWeight.extrabold
        },
        style,
        animatedStyle
      ]}
    >
      {prefix}{formatValue(displayValue)}{suffix}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 32
  }
});

