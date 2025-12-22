import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { StewiePayBrand } from '../brand/StewiePayBrand';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  style?: any;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  useSpring?: boolean;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  style,
  prefix = '',
  suffix = '',
  decimals = 0,
  useSpring = false
}) => {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animatedValue.value = useSpring
      ? withSpring(value, {
          damping: 15,
          stiffness: 100
        })
      : withTiming(value, { duration });
  }, [value, duration, useSpring]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayValue((prev) => {
        const diff = value - prev;
        if (Math.abs(diff) < 0.01) return value;
        return prev + diff * 0.1;
      });
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      animatedValue.value,
      [value * 0.9, value],
      [1, 1.1],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ scale }]
    };
  });

  return (
    <Animated.Text style={[styles.text, { color: StewiePayBrand.colors.textPrimary }, style, animatedStyle]}>
      {prefix}{displayValue.toFixed(decimals).toLocaleString()}{suffix}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontWeight: '800',
    fontSize: 32
  }
});

