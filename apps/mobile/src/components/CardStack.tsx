import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import { PremiumCardV2 } from './PremiumCardV2';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = 220;
const SWIPE_THRESHOLD = 100;
const MAX_CARDS = 3;

interface Card {
  id: string;
  cardNumber: string;
  cardholderName: string;
  type: string;
  status: string;
  balance: number;
  currency: string;
  gradient?: string[];
}

interface CardStackProps {
  cards: Card[];
  onCardPress?: (cardId: string) => void;
  onCardSwipe?: (cardId: string, direction: 'left' | 'right') => void;
}

/**
 * Card stack carousel with Revolut-level 3D depth and interactions
 * - Multiple cards with depth
 * - Swipe to navigate
 * - 3D perspective
 * - Smooth animations
 */
export const CardStack: React.FC<CardStackProps> = ({
  cards,
  onCardPress,
  onCardSwipe
}) => {
  const currentIndex = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const handleSwipe = (direction: 'left' | 'right') => {
    'worklet';
    if (direction === 'left' && currentIndex.value < cards.length - 1) {
      currentIndex.value = withSpring(currentIndex.value + 1, {
        damping: 15,
        stiffness: 100
      });
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      if (onCardSwipe) {
        runOnJS(onCardSwipe)(cards[Math.floor(currentIndex.value) + 1]?.id || '', 'left');
      }
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    } else if (direction === 'right' && currentIndex.value > 0) {
      currentIndex.value = withSpring(currentIndex.value - 1, {
        damping: 15,
        stiffness: 100
      });
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      if (onCardSwipe) {
        runOnJS(onCardSwipe)(cards[Math.floor(currentIndex.value) - 1]?.id || '', 'right');
      }
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // Spring back
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      'worklet';
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      'worklet';
      if (translateX.value < -SWIPE_THRESHOLD) {
        handleSwipe('left');
      } else if (translateX.value > SWIPE_THRESHOLD) {
        handleSwipe('right');
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const renderCard = (card: Card, index: number) => {
    const cardIndex = index - currentIndex.value;
    const isActive = cardIndex === 0;
    const isNext = cardIndex === 1;
    const isPrevious = cardIndex === -1;

    const cardStyle = useAnimatedStyle(() => {
      const offset = cardIndex * 20;
      const scale = interpolate(
        cardIndex,
        [-1, 0, 1],
        [0.9, 1, 0.95],
        Extrapolate.CLAMP
      );
      const opacity = interpolate(
        Math.abs(cardIndex),
        [0, 1, 2],
        [1, 0.8, 0],
        Extrapolate.CLAMP
      );
      const translateXOffset = cardIndex === 0 ? translateX.value : 0;
      const translateYOffset = cardIndex === 0 ? translateY.value : 0;
      const rotateY = cardIndex === 0
        ? interpolate(
            translateX.value,
            [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
            [-10, 0, 10],
            Extrapolate.CLAMP
          )
        : 0;

      return {
        transform: [
          { translateX: translateXOffset },
          { translateY: translateYOffset + offset },
          { scale },
          { rotateY: `${rotateY}deg` },
          { perspective: 1000 }
        ],
        opacity,
        zIndex: MAX_CARDS - Math.abs(cardIndex)
      };
    });

    if (Math.abs(cardIndex) > 1) return null;

    return (
      <Animated.View
        key={card.id}
        style={[
          styles.cardContainer,
          cardStyle,
          {
            position: 'absolute',
            top: 0,
            left: 0
          }
        ]}
      >
        {isActive ? (
          <GestureDetector gesture={panGesture}>
            <Animated.View>
              <PremiumCardV2
                cardNumber={card.cardNumber}
                cardholderName={card.cardholderName}
                type={card.type}
                status={card.status}
                balance={card.balance}
                currency={card.currency}
                gradient={card.gradient}
                onPress={() => onCardPress?.(card.id)}
              />
            </Animated.View>
          </GestureDetector>
        ) : (
          <Animated.View>
            <PremiumCardV2
              cardNumber={card.cardNumber}
              cardholderName={card.cardholderName}
              type={card.type}
              status={card.status}
              balance={card.balance}
              currency={card.currency}
              gradient={card.gradient}
              onPress={() => onCardPress?.(card.id)}
            />
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.stackContainer}>
        {cards.slice(0, MAX_CARDS).map((card, index) => renderCard(card, index))}
      </View>
      
      {/* Card indicators */}
      {cards.length > 1 && (
        <View style={styles.indicators}>
          {cards.map((_, index) => {
            const isActive = Math.floor(currentIndex.value) === index;
            return (
              <View
                key={index}
                style={[
                  styles.indicator,
                  {
                    backgroundColor: isActive
                      ? StewiePayBrand.colors.primary
                      : StewiePayBrand.colors.onSurfaceVariant,
                    width: isActive ? 24 : 8,
                    opacity: isActive ? 1 : 0.5
                  }
                ]}
              />
            );
          })}
        </View>
      )}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT + 40,
    marginHorizontal: 20,
    marginVertical: 10
  },
  stackContainer: {
    width: '100%',
    height: CARD_HEIGHT,
    position: 'relative'
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  }
});

