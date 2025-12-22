import React, { useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, TouchableOpacity, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useOnboarding } from '../contexts/OnboardingContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieText } from '../components/stewiepay/StewieText';
import { StewieButton } from '../components/stewiepay/StewieButton';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    id: 1,
    icon: 'card-outline' as keyof typeof Ionicons.glyphMap,
    title: 'Control Every Spend',
    subtitle: 'Virtual cards that adapt to your needs',
    description: 'Set limits, lock merchants, and track every transaction. Your money, your rules.',
    gradient: StewiePayBrand.colors.gradients.primary,
  },
  {
    id: 2,
    icon: 'lock-closed-outline' as keyof typeof Ionicons.glyphMap,
    title: 'Security First',
    subtitle: 'Bank-grade protection',
    description: 'Freeze cards instantly, set spending limits, and get real-time alerts. Peace of mind, built in.',
    gradient: StewiePayBrand.colors.gradients.accent,
  },
  {
    id: 3,
    icon: 'stats-chart-outline' as keyof typeof Ionicons.glyphMap,
    title: 'Insights That Matter',
    subtitle: 'Understand your spending',
    description: 'Analytics show you where your money goes. Make smarter decisions, effortlessly.',
    gradient: StewiePayBrand.colors.gradients.secondary,
  },
  {
    id: 4,
    icon: 'checkmark-circle-outline' as keyof typeof Ionicons.glyphMap,
    title: 'Ready to Begin?',
    subtitle: 'Financial control starts here',
    description: 'Simple, elegant, powerful.',
    gradient: StewiePayBrand.colors.gradients.success,
  },
];

export const OnboardingScreen = ({ navigation }: any) => {
  const { completeOnboarding } = useOnboarding();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentPage < ONBOARDING_SLIDES.length - 1) {
      const nextPage = currentPage + 1;
      scrollViewRef.current?.scrollTo({ x: nextPage * width, animated: true });
      setCurrentPage(nextPage);
    } else {
      handleGetStarted();
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / width);
    if (page !== currentPage) {
      setCurrentPage(page);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await completeOnboarding();
    navigation.replace('Login');
  };

  const handleGetStarted = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await completeOnboarding();
    navigation.replace('Signup');
  };

  const renderSlide = (slide: typeof ONBOARDING_SLIDES[0], index: number) => {
    const isLast = index === ONBOARDING_SLIDES.length - 1;

    return (
      <View key={slide.id} style={styles.slide}>
        <LinearGradient
          colors={slide.gradient as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.slideContent}>
            <Animatable.View
              animation="fadeIn"
              duration={600}
              delay={200}
              style={styles.iconContainer}
            >
              <Ionicons name={slide.icon} size={80} color="#FFFFFF" />
            </Animatable.View>

            <Animatable.View
              animation="fadeInUp"
              duration={600}
              delay={400}
              style={styles.textContainer}
            >
              <StewieText variant="displayMedium" color="primary" weight="black" style={styles.title}>
                {slide.title}
              </StewieText>
              <StewieText variant="headlineMedium" color="primary" weight="bold" style={styles.subtitle}>
                {slide.subtitle}
              </StewieText>
              <StewieText variant="bodyLarge" color="primary" style={styles.description}>
                {slide.description}
              </StewieText>
            </Animatable.View>

            {isLast && (
              <Animatable.View
                animation="fadeIn"
                duration={600}
                delay={600}
                style={styles.buttonContainer}
              >
                <StewieButton
                  label="Continue"
                  onPress={handleGetStarted}
                  variant="primary"
                  size="lg"
                  fullWidth
                  style={styles.getStartedButton}
                  icon={<Ionicons name="arrow-forward" size={24} color="#FFFFFF" />}
                />
              </Animatable.View>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      {currentPage < ONBOARDING_SLIDES.length - 1 && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <StewieText variant="bodyMedium" color="primary" weight="semibold" style={styles.skipText}>
            Skip
          </StewieText>
        </TouchableOpacity>
      )}

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        {ONBOARDING_SLIDES.map((slide, index) => renderSlide(slide, index))}
      </ScrollView>

      {/* Page Indicators */}
      <View style={styles.indicators}>
        {ONBOARDING_SLIDES.map((_, index) => (
          <Animatable.View
            key={index}
            animation={currentPage === index ? 'pulse' : undefined}
            style={[
              styles.indicator,
              {
                backgroundColor:
                  currentPage === index ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)',
                width: currentPage === index ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Next Button */}
      {currentPage < ONBOARDING_SLIDES.length - 1 && (
        <Animatable.View
          animation="fadeInUp"
          duration={400}
          style={styles.nextButtonContainer}
        >
          <StewieButton
            label="Next"
            onPress={handleNext}
            variant="primary"
            size="lg"
            fullWidth
            style={styles.nextButton}
            icon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
          />
        </Animatable.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A', // Darker than cards but not pure black
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: StewiePayBrand.spacing.sm,
  },
  skipText: {
    opacity: 0.9,
  },
  pager: {
    flex: 1,
  },
  slide: {
    width,
    height,
    justifyContent: 'center',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: StewiePayBrand.spacing['2xl'],
  },
  slideContent: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: StewiePayBrand.spacing['2xl'],
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: StewiePayBrand.spacing['2xl'],
  },
  title: {
    textAlign: 'center',
    marginBottom: StewiePayBrand.spacing.md,
    fontSize: 42,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: StewiePayBrand.spacing.lg,
    fontSize: 24,
  },
  description: {
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 18,
    paddingHorizontal: StewiePayBrand.spacing.md,
    opacity: 0.9,
  },
  buttonContainer: {
    width: '100%',
    marginTop: StewiePayBrand.spacing['2xl'],
  },
  getStartedButton: {
    borderRadius: StewiePayBrand.radius.lg,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    gap: StewiePayBrand.spacing.sm,
  },
  indicator: {
    height: 8,
    borderRadius: StewiePayBrand.radius.sm,
  },
  nextButtonContainer: {
    position: 'absolute',
    bottom: StewiePayBrand.spacing['2xl'],
    left: StewiePayBrand.spacing.md,
    right: StewiePayBrand.spacing.md,
  },
  nextButton: {
    borderRadius: StewiePayBrand.radius.lg,
    backgroundColor: '#FFFFFF',
  },
});
