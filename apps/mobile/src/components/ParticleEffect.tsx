import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

interface ParticleEffectProps {
  particleCount?: number;
  colors?: string[];
  duration?: number;
}

export const ParticleEffect: React.FC<ParticleEffectProps> = ({
  particleCount = 20,
  colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'],
  duration = 2000
}) => {
  const particles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 8 + 4,
    duration: Math.random() * duration + duration,
    delay: Math.random() * 500
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <Particle key={particle.id} particle={particle} colors={colors} />
      ))}
    </View>
  );
};

const Particle: React.FC<{ particle: Particle; colors: string[] }> = ({ particle, colors }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSequence(
      withTiming(0, { duration: particle.delay }),
      withTiming(-200, { duration: particle.duration })
    );
    translateX.value = withSequence(
      withTiming(0, { duration: particle.delay }),
      withTiming((Math.random() - 0.5) * 100, { duration: particle.duration })
    );
    opacity.value = withSequence(
      withTiming(1, { duration: particle.delay }),
      withTiming(0, { duration: particle.duration })
    );
    scale.value = withSequence(
      withTiming(1, { duration: particle.delay }),
      withTiming(0, { duration: particle.duration })
    );
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotation.value}deg` }
      ],
      opacity: opacity.value
    };
  });

  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: particle.size,
          height: particle.size,
          backgroundColor: color,
          left: `${particle.x}%`,
          top: `${particle.y}%`
        },
        animatedStyle
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden'
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5
  }
});















