import React from 'react';
import { View, ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

interface SharedElementProps extends ViewProps {
  id: string;
  children: React.ReactNode;
  animated?: boolean;
}

/**
 * Shared element for smooth transitions between screens
 * Similar to Revolut's card transition animations
 */
export const SharedElement: React.FC<SharedElementProps> = ({
  id,
  children,
  animated = true,
  style,
  ...props
}) => {
  const opacity = useSharedValue(animated ? 0 : 1);
  const scale = useSharedValue(animated ? 0.9 : 1);

  React.useEffect(() => {
    if (animated) {
      opacity.value = withSpring(1, {
        damping: 15,
        stiffness: 100
      });
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 100
      });
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }]
    };
  });

  return (
    <Animated.View
      style={[animatedStyle, style]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};













