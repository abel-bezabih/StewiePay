import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieText } from './stewiepay/StewieText';

interface SplashScreenProps {
  onFinish: () => void;
}

const { width, height } = Dimensions.get('window');

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    // Show splash for at least 1.5 seconds for brand impression
    const timer = setTimeout(() => {
      onFinish();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={(StewiePayBrand?.colors?.gradients?.primary || ['#5B21B6', '#4C1D95']) as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animatable.View
          animation="fadeIn"
          duration={800}
          style={styles.content}
        >
          <Animatable.View
            animation="fadeInUp"
            delay={200}
            duration={600}
            style={styles.brandContainer}
          >
            <StewieText
              variant="headlineLarge"
              color="primary"
              weight="black"
              style={styles.brandName}
            >
              StewiePay
            </StewieText>
          </Animatable.View>

          {/* Decorative Card Elements - Modern Design */}
          <View style={styles.decorativeCard1}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.cardTopSection}>
              <View style={styles.cardChip} />
            </View>
            <View style={styles.cardBottomSection}>
              <View style={styles.cardNumbers}>
                <View style={[styles.cardNumberLine, { width: '100%' }]} />
                <View style={[styles.cardNumberLine, { width: '75%' }]} />
                <View style={[styles.cardNumberLine, { width: '85%' }]} />
              </View>
              <StewieText
                variant="labelSmall"
                color="primary"
                weight="semibold"
                style={styles.cardBrandNameText}
              >
                StewiePay
              </StewieText>
            </View>
            <View style={styles.cardPatternOverlay} />
          </View>
          <View style={styles.decorativeCard2}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.22)', 'rgba(255, 255, 255, 0.12)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.cardTopSection}>
              <View style={styles.cardChip} />
            </View>
            <View style={styles.cardBottomSection}>
              <View style={styles.cardNumbers}>
                <View style={[styles.cardNumberLine, { width: '90%' }]} />
                <View style={[styles.cardNumberLine, { width: '65%' }]} />
                <View style={[styles.cardNumberLine, { width: '80%' }]} />
              </View>
              <StewieText
                variant="labelSmall"
                color="primary"
                weight="semibold"
                style={styles.cardBrandNameText}
              >
                StewiePay
              </StewieText>
            </View>
            <View style={styles.cardPatternOverlay} />
          </View>
        </Animatable.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  brandContainer: {
    // Centered brand name
  },
  brandName: {
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  decorativeCard1: {
    position: 'absolute',
    width: 240,
    height: 150,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    top: 100,
    right: -60,
    transform: [{ rotate: '15deg' }],
    zIndex: 0,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    padding: 18,
    overflow: 'hidden',
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  decorativeCard2: {
    position: 'absolute',
    width: 220,
    height: 140,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    bottom: 150,
    left: -50,
    transform: [{ rotate: '-12deg' }],
    zIndex: 0,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    padding: 18,
    overflow: 'hidden',
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  cardTopSection: {
    marginBottom: 20,
  },
  cardChip: {
    width: 36,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardBottomSection: {
    marginTop: 'auto',
  },
  cardNumbers: {
    marginBottom: 12,
  },
  cardNumberLine: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 2,
    marginBottom: 5,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cardBrandNameText: {
    color: '#FFFFFF',
    fontSize: 9,
    letterSpacing: 0.8,
    marginTop: 8,
  },
  cardPatternOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    backgroundColor: 'rgba(91, 33, 182, 0.08)',
    opacity: 0.5,
  },
});


