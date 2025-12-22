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
 * FintechBackground - Dark Gray with crazy creative design
 * Beautiful abstract patterns with dark gray tones
 */
export const FintechBackground: React.FC<FintechBackgroundProps> = ({ children, style }) => {
  return (
    <View style={[styles.container, style]}>
      {/* Base dark gray gradient - beautiful flow */}
      <LinearGradient
        colors={[
          '#2D2D2D', // Dark gray (top)
          '#252525', // Darker gray
          '#1F1F1F', // Very dark gray
          '#1A1A1A', // Almost black gray
          '#151515', // Deep dark gray
          '#0F0F0F', // Nearly black (bottom)
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Radial gradient overlay - creates depth with dark gray tones */}
      <LinearGradient
        colors={[
          'rgba(45, 45, 45, 0.8)', // Dark gray center
          'rgba(37, 37, 37, 0.6)', // Medium dark gray
          'rgba(31, 31, 31, 0.4)', // Deep dark gray edges
        ]}
        start={{ x: 0.3, y: 0.3 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Diagonal wave pattern with dark gray */}
      <LinearGradient
        colors={[
          'transparent',
          'rgba(50, 50, 50, 0.4)',
          'transparent',
          'rgba(40, 40, 40, 0.5)',
          'transparent',
        ]}
        locations={[0, 0.3, 0.5, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Crazy abstract shapes - Large organic circles */}
      <View style={styles.organicCircle1} />
      <View style={styles.organicCircle2} />
      <View style={styles.organicCircle3} />
      <View style={styles.organicCircle4} />
      <View style={styles.organicCircle5} />
      
      {/* Geometric shapes - Hexagons and diamonds effect */}
      <View style={styles.geometricShape1} />
      <View style={styles.geometricShape2} />
      <View style={styles.geometricShape3} />
      
      {/* Flowing lines - organic curves */}
      <View style={styles.flowLine1} />
      <View style={styles.flowLine2} />
      <View style={styles.flowLine3} />
      <View style={styles.flowLine4} />
      <View style={styles.flowLine5} />
      
      {/* Sparkle dots pattern */}
      <View style={styles.sparkleContainer} pointerEvents="none">
        {Array.from({ length: 30 }).map((_, i) => (
          <View 
            key={`sparkle-${i}`} 
            style={[
              styles.sparkle,
              {
                left: (i * 37) % SCREEN_WIDTH,
                top: (i * 43) % SCREEN_HEIGHT,
                opacity: 0.3 + (i % 3) * 0.2,
              }
            ]} 
          />
        ))}
      </View>
      
      {/* Mesh gradient overlay - adds texture with dark gray */}
      <LinearGradient
        colors={[
          'rgba(50, 50, 50, 0.3)',
          'transparent',
          'rgba(40, 40, 40, 0.2)',
          'transparent',
          'rgba(30, 30, 30, 0.25)',
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
    backgroundColor: '#1F1F1F', // Dark gray base color
  },
  // Organic circles - large flowing shapes with dark gray
  organicCircle1: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: 'rgba(50, 50, 50, 0.5)', // Dark gray
    top: -250,
    right: -200,
    opacity: 0.7,
  },
  organicCircle2: {
    position: 'absolute',
    width: 550,
    height: 550,
    borderRadius: 275,
    backgroundColor: 'rgba(40, 40, 40, 0.4)', // Medium dark gray
    bottom: -200,
    left: -150,
    opacity: 0.6,
  },
  organicCircle3: {
    position: 'absolute',
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: 'rgba(45, 45, 45, 0.5)', // Soft dark gray
    top: SCREEN_HEIGHT * 0.35,
    right: SCREEN_WIDTH * 0.1,
    opacity: 0.55,
  },
  organicCircle4: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(35, 35, 35, 0.4)', // Rich dark gray
    top: SCREEN_HEIGHT * 0.65,
    left: SCREEN_WIDTH * 0.05,
    opacity: 0.5,
  },
  organicCircle5: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(30, 30, 30, 0.45)', // Deep dark gray
    top: SCREEN_HEIGHT * 0.2,
    left: SCREEN_WIDTH * 0.4,
    opacity: 0.48,
  },
  // Geometric shapes - hexagon/diamond effect with dark gray
  geometricShape1: {
    position: 'absolute',
    width: 200,
    height: 200,
    backgroundColor: 'rgba(50, 50, 50, 0.3)',
    top: SCREEN_HEIGHT * 0.1,
    left: SCREEN_WIDTH * 0.2,
    transform: [{ rotate: '45deg' }],
    borderRadius: 40,
    opacity: 0.4,
  },
  geometricShape2: {
    position: 'absolute',
    width: 180,
    height: 180,
    backgroundColor: 'rgba(40, 40, 40, 0.35)',
    bottom: SCREEN_HEIGHT * 0.15,
    right: SCREEN_WIDTH * 0.25,
    transform: [{ rotate: '-30deg' }],
    borderRadius: 35,
    opacity: 0.35,
  },
  geometricShape3: {
    position: 'absolute',
    width: 160,
    height: 160,
    backgroundColor: 'rgba(45, 45, 45, 0.3)',
    top: SCREEN_HEIGHT * 0.5,
    left: SCREEN_WIDTH * 0.7,
    transform: [{ rotate: '60deg' }],
    borderRadius: 30,
    opacity: 0.3,
  },
  // Flowing organic lines with dark gray
  flowLine1: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.8,
    height: 4,
    backgroundColor: 'rgba(50, 50, 50, 0.6)',
    top: SCREEN_HEIGHT * 0.12,
    left: -SCREEN_WIDTH * 0.15,
    transform: [{ rotate: '25deg' }],
    borderRadius: 2,
    opacity: 0.5,
  },
  flowLine2: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.7,
    height: 3.5,
    backgroundColor: 'rgba(40, 40, 40, 0.55)',
    bottom: SCREEN_HEIGHT * 0.2,
    right: -SCREEN_WIDTH * 0.1,
    transform: [{ rotate: '-35deg' }],
    borderRadius: 2,
    opacity: 0.45,
  },
  flowLine3: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.6,
    height: 3,
    backgroundColor: 'rgba(45, 45, 45, 0.5)',
    top: SCREEN_HEIGHT * 0.5,
    left: SCREEN_WIDTH * 0.15,
    transform: [{ rotate: '50deg' }],
    borderRadius: 2,
    opacity: 0.4,
  },
  flowLine4: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.5,
    height: 2.5,
    backgroundColor: 'rgba(35, 35, 35, 0.45)',
    top: SCREEN_HEIGHT * 0.7,
    right: SCREEN_WIDTH * 0.2,
    transform: [{ rotate: '-55deg' }],
    borderRadius: 2,
    opacity: 0.35,
  },
  flowLine5: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.45,
    height: 2,
    backgroundColor: 'rgba(30, 30, 30, 0.4)',
    top: SCREEN_HEIGHT * 0.3,
    left: SCREEN_WIDTH * 0.5,
    transform: [{ rotate: '70deg' }],
    borderRadius: 2,
    opacity: 0.3,
  },
  // Sparkle dots container
  sparkleContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  sparkle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(80, 80, 80, 0.8)', // Dark gray sparkles
  },
});

