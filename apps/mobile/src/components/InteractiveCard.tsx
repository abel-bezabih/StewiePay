import React from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS
} from 'react-native-reanimated';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = 220;
const SWIPE_THRESHOLD = 100;

interface InteractiveCardProps {
  cardNumber?: string;
  cardholderName?: string;
  type?: string;
  status?: string;
  balance?: number;
  currency?: string;
  gradient?: [string, string];
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onPress?: () => void;
}

export const InteractiveCard: React.FC<InteractiveCardProps> = ({
  cardNumber = '4242 4242 4242 4242',
  cardholderName = 'Cardholder',
  type = 'PERMANENT',
  status = 'ACTIVE',
  balance = 0,
  currency = 'ETB',
  gradient = ['#667EEA', '#764BA2'],
  onSwipeLeft,
  onSwipeRight,
  onPress
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotateZ = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((event) => {
      'worklet';
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      
      // 3D tilt effect
      rotateZ.value = interpolate(
        translateX.value,
        [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        [-15, 0, 15],
        Extrapolate.CLAMP
      );

      // Scale down slightly when dragging
      scale.value = withTiming(0.95, { duration: 100 });
    })
    .onEnd(() => {
      'worklet';
      const shouldSwipeLeft = translateX.value < -SWIPE_THRESHOLD;
      const shouldSwipeRight = translateX.value > SWIPE_THRESHOLD;

      if (shouldSwipeLeft && onSwipeLeft) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        runOnJS(onSwipeLeft)();
      } else if (shouldSwipeRight && onSwipeRight) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        runOnJS(onSwipeRight)();
      } else {
        // Spring back to center
        translateX.value = withSpring(0, { damping: 15, stiffness: 100 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
        rotateZ.value = withSpring(0, { damping: 15, stiffness: 100 });
        scale.value = withSpring(1, { damping: 15, stiffness: 100 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotateZ.value}deg` },
        { scale: scale.value }
      ],
      opacity: opacity.value
    };
  });

  const cardStyle = useAnimatedStyle(() => {
    const perspective = 1000;
    const rotateY = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-15, 0, 15],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { perspective },
        { rotateY: `${rotateY}deg` },
        { rotateX: `${interpolate(translateY.value, [-100, 0, 100], [5, 0, -5], Extrapolate.CLAMP)}deg` }
      ]
    };
  });

  const cardContent = (
    <Animated.View style={[styles.cardContainer, animatedStyle]}>
      <Animated.View style={[styles.card, cardStyle]}>
        <LinearGradient
          colors={status === 'FROZEN' ? (['#4B5563', '#6B7280'] as [string, string]) : gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Card Chip */}
          <View style={styles.chipContainer}>
            <View style={styles.chip} />
          </View>

          {/* Card Number with animated reveal */}
          <View style={styles.cardNumberContainer}>
            <Text style={styles.cardNumber}>
              {cardNumber.match(/.{1,4}/g)?.join(' ') || cardNumber}
            </Text>
          </View>

          {/* Balance */}
          {balance !== undefined && (
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>
                Available Balance
              </Text>
              <Text style={styles.balanceAmount}>
                {currency} {balance.toLocaleString()}
              </Text>
            </View>
          )}

          {/* Cardholder Name */}
          <View style={styles.footer}>
            <View style={styles.cardholderContainer}>
              <Text style={styles.cardholderName}>
                {cardholderName.toUpperCase()}
              </Text>
              <Text style={styles.cardType}>
                {type.replace('_', ' ')}
              </Text>
            </View>
            {status === 'FROZEN' && (
              <View style={styles.frozenBadge}>
                <Text style={styles.frozenText}>❄️ FROZEN</Text>
              </View>
            )}
          </View>

          {/* Decorative Elements */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      {onPress ? (
        <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
          <GestureDetector gesture={panGesture}>
            {cardContent}
          </GestureDetector>
        </TouchableOpacity>
      ) : (
        <GestureDetector gesture={panGesture}>
          {cardContent}
        </GestureDetector>
      )}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginHorizontal: 20,
    marginVertical: 10
  },
  cardContainer: {
    width: '100%',
    height: '100%'
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  gradient: {
    width: '100%',
    height: '100%',
    padding: 24,
    justifyContent: 'space-between'
  },
  chipContainer: {
    alignItems: 'flex-start',
    marginBottom: 20
  },
  chip: {
    width: 50,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)'
  },
  cardNumberContainer: {
    marginBottom: 20
  },
  cardNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 2
  },
  balanceContainer: {
    marginBottom: 20
  },
  balanceLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    fontWeight: '500'
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  cardholderContainer: {
    flex: 1
  },
  cardholderName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 4
  },
  cardType: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500'
  },
  frozenBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  frozenText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1
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

