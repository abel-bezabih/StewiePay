import React from 'react';
import { ScrollView, StyleSheet, NativeScrollEvent, NativeSyntheticEvent, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

interface ParallaxScrollViewProps {
  children: React.ReactNode;
  headerHeight?: number;
  parallaxSpeed?: number;
  headerComponent?: React.ReactNode;
  style?: any;
}

export const ParallaxScrollView: React.FC<ParallaxScrollViewProps> = ({
  children,
  headerHeight = 200,
  parallaxSpeed = 0.5,
  headerComponent,
  style
}) => {
  const scrollY = useSharedValue(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, headerHeight],
      [0, -headerHeight * parallaxSpeed],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollY.value,
      [0, headerHeight * 0.5],
      [1, 0],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [0, headerHeight],
      [1, 1.2],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }, { scale }],
      opacity
    };
  });

  return (
    <ScrollView
      style={[styles.container, style]}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
    >
      {headerComponent && (
        <Animated.View style={[styles.header, { height: headerHeight }, headerAnimatedStyle]}>
          {headerComponent}
        </Animated.View>
      )}
      <View style={styles.content}>{children}</View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden'
  },
  content: {
    marginTop: 200 // Adjust based on headerHeight
  }
});

