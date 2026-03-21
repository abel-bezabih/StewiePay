import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StewiePayBrand } from '../brand/StewiePayBrand';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FintechBackgroundProps {
  children?: React.ReactNode;
  style?: any;
}

/**
 * FintechBackground - Light Grayish White to Purple Gradient
 * Beautiful gradient from top to bottom: starts light, transitions to purple from middle, deepens downward
 */
export const FintechBackground: React.FC<FintechBackgroundProps> = ({ children, style }) => {
  return (
    <View style={[styles.container, style]}>
      {/* Main gradient - Light grayish white (top) to Purple (bottom) */}
      <LinearGradient
        colors={[
          '#F8F9FB', // Light grayish white at top
          '#F8F9FB', // Light grayish white continues
          '#F5F3FF', // Very light purple tint starts (middle)
          '#EDE9FE', // Light purple tint
          '#E9D5FF', // Medium light purple
          '#DDD6FE', // Medium purple
          '#C4B5FD', // Deeper purple
          '#A78BFA', // Deep purple (bottom)
        ]}
        locations={[0, 0.3, 0.5, 0.6, 0.7, 0.8, 0.9, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Subtle radial overlay - adds depth with purple tones */}
      <LinearGradient
        colors={[
          'rgba(248, 249, 251, 0.3)', // Light overlay at top
          'transparent',
          'rgba(167, 139, 250, 0.15)', // Subtle purple overlay at bottom
        ]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Subtle diagonal accent - adds sophistication with purple tones */}
      <LinearGradient
        colors={[
          'transparent',
          'rgba(237, 233, 254, 0.12)', // Very light purple
          'transparent',
          'rgba(196, 181, 253, 0.08)', // Light purple
          'transparent',
        ]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Subtle abstract shapes - Large soft circles for depth */}
      <View style={styles.organicCircle1} />
      <View style={styles.organicCircle2} />
      <View style={styles.organicCircle3} />
      
      {/* Subtle geometric accents */}
      <View style={styles.geometricShape1} />
      <View style={styles.geometricShape2} />
      
      {/* Subtle flowing lines - minimal design */}
      <View style={styles.flowLine1} />
      <View style={styles.flowLine2} />
      <View style={styles.flowLine3} />
      
      {/* Subtle mesh overlay - adds texture with purple tones */}
      <LinearGradient
        colors={[
          'rgba(248, 249, 251, 0.08)',
          'transparent',
          'rgba(237, 233, 254, 0.06)',
          'transparent',
          'rgba(196, 181, 253, 0.08)',
        ]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#F8F9FB', // Light grayish white base color
  },
  // Organic circles - large soft shapes with purple tones
  organicCircle1: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(237, 233, 254, 0.2)', // Very light purple
    top: -200,
    right: -150,
    opacity: 0.3,
  },
  organicCircle2: {
    position: 'absolute',
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: 'rgba(221, 214, 254, 0.15)', // Light purple
    bottom: -150,
    left: -100,
    opacity: 0.25,
  },
  organicCircle3: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(196, 181, 253, 0.12)', // Medium purple
    top: SCREEN_HEIGHT * 0.4,
    right: SCREEN_WIDTH * 0.15,
    opacity: 0.2,
  },
  // Geometric shapes - subtle purple accents
  geometricShape1: {
    position: 'absolute',
    width: 180,
    height: 180,
    backgroundColor: 'rgba(237, 233, 254, 0.15)',
    top: SCREEN_HEIGHT * 0.15,
    left: SCREEN_WIDTH * 0.25,
    transform: [{ rotate: '45deg' }],
    borderRadius: 35,
    opacity: 0.2,
  },
  geometricShape2: {
    position: 'absolute',
    width: 160,
    height: 160,
    backgroundColor: 'rgba(196, 181, 253, 0.12)',
    bottom: SCREEN_HEIGHT * 0.2,
    right: SCREEN_WIDTH * 0.3,
    transform: [{ rotate: '-30deg' }],
    borderRadius: 30,
    opacity: 0.15,
  },
  // Flowing lines - subtle purple organic curves
  flowLine1: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.7,
    height: 2,
    backgroundColor: 'rgba(237, 233, 254, 0.25)',
    top: SCREEN_HEIGHT * 0.2,
    left: -SCREEN_WIDTH * 0.1,
    transform: [{ rotate: '20deg' }],
    borderRadius: 1,
    opacity: 0.15,
  },
  flowLine2: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.6,
    height: 1.5,
    backgroundColor: 'rgba(196, 181, 253, 0.2)',
    bottom: SCREEN_HEIGHT * 0.25,
    right: -SCREEN_WIDTH * 0.05,
    transform: [{ rotate: '-25deg' }],
    borderRadius: 1,
    opacity: 0.12,
  },
  flowLine3: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.5,
    height: 1,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    top: SCREEN_HEIGHT * 0.6,
    left: SCREEN_WIDTH * 0.2,
    transform: [{ rotate: '40deg' }],
    borderRadius: 1,
    opacity: 0.1,
  },
});

