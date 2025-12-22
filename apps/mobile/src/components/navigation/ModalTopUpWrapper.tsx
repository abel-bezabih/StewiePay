import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { StewiePayBrand } from '../../brand/StewiePayBrand';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// FAB position - center bottom of screen (matching navigation/index.tsx)
const FAB_SIZE = 56;
const FAB_BOTTOM = Platform.OS === 'ios' ? 50 : 42;
const FAB_CENTER_X = SCREEN_WIDTH / 2; // Center horizontally
const FAB_CENTER_Y = SCREEN_HEIGHT - FAB_BOTTOM - FAB_SIZE / 2; // Center of FAB vertically

interface ModalTopUpWrapperProps {
  children: React.ReactNode;
}

export const ModalTopUpWrapper: React.FC<ModalTopUpWrapperProps> = ({ children }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Calculate initial transforms to position content at FAB location
    // We want the center of the screen to be at the FAB center
    const initialTranslateX = FAB_CENTER_X - SCREEN_WIDTH / 2;
    const initialTranslateY = FAB_CENTER_Y - SCREEN_HEIGHT / 2;
    
    // Start from FAB size (very small scale)
    const initialScale = FAB_SIZE / Math.max(SCREEN_WIDTH, SCREEN_HEIGHT);
    
    // Set initial values
    translateX.value = initialTranslateX;
    translateY.value = initialTranslateY;
    scale.value = initialScale;
    opacity.value = 0;

    // Animate to full screen - expand from FAB position (fast)
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 200,
      mass: 0.2,
    });
    translateX.value = withSpring(0, {
      damping: 15,
      stiffness: 200,
      mass: 0.2,
    });
    translateY.value = withSpring(0, {
      damping: 15,
      stiffness: 200,
      mass: 0.2,
    });
    opacity.value = withTiming(1, {
      duration: 150,
      easing: Easing.out(Easing.ease),
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value }
      ],
      opacity: opacity.value,
    };
  });

  const backgroundColor = StewiePayBrand?.colors?.backgroundSecondary || '#6B7280';
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Animated.View style={[styles.content, { backgroundColor }, animatedStyle]}>
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});

