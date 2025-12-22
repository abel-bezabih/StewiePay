import React, { useCallback, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { StewiePayBrand } from '../../brand/StewiePayBrand';

// Try to import BlurView, fallback to View if not available
let BlurView: any;
try {
  BlurView = require('expo-blur').BlurView;
} catch {
  BlurView = View; // Fallback
}
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_HEIGHT = SCREEN_HEIGHT * 0.7;
const SNAP_POINTS = [0.3, 0.5, 0.7, 0.9]; // Percentage of screen height

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number;
  snapPoints?: number[];
  enablePanDownToClose?: boolean;
  style?: ViewStyle;
}

/**
 * Modern Bottom Sheet Component
 * 
 * Features:
 * - Gesture-based dragging
 * - Smooth spring animations
 * - Multiple snap points
 * - Blur backdrop
 * - Haptic feedback
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  height = DEFAULT_HEIGHT,
  snapPoints = SNAP_POINTS,
  enablePanDownToClose = true,
  style,
}) => {
  const translateY = useSharedValue(height);
  const isDragging = useSharedValue(false);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      translateY.value = withTiming(height, {
        duration: 250,
      });
    }
  }, [visible, height]);

  const closeSheet = useCallback(() => {
    translateY.value = withTiming(height, {
      duration: 250,
    }, () => {
      runOnJS(onClose)();
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [height, onClose]);

  const animatedSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const animatedBackdropStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [0, height],
      [1, 0],
      Extrapolate.CLAMP
    );
    return {
      opacity,
    };
  });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      isDragging.value = true;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        translateY.value = gestureState.dy;
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      isDragging.value = false;
      const shouldClose = gestureState.dy > height * 0.3 || gestureState.vy > 0.5;
      
      if (shouldClose && enablePanDownToClose) {
        closeSheet();
      } else {
        // Snap to nearest snap point
        const snapPoint = snapPoints
          .map(p => height * p)
          .reduce((prev, curr) => 
            Math.abs(curr - gestureState.dy) < Math.abs(prev - gestureState.dy) ? curr : prev
          );
        translateY.value = withSpring(snapPoint, {
          damping: 20,
          stiffness: 300,
        });
      }
    },
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeSheet}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        </Animated.View>

        {/* Backdrop Touch Handler */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={closeSheet}
        />

        {/* Sheet */}
        <Animated.View
          style={[styles.sheet, { height }, animatedSheetStyle, style]}
          {...panResponder.panHandlers}
        >
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeSheet}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={StewiePayBrand.colors.textPrimary} />
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.content}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    borderTopLeftRadius: StewiePayBrand.radius['3xl'],
    borderTopRightRadius: StewiePayBrand.radius['3xl'],
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: StewiePayBrand.spacing.sm,
    paddingBottom: StewiePayBrand.spacing.xs,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: StewiePayBrand.colors.textMuted,
    opacity: 0.5,
  },
  closeButton: {
    position: 'absolute',
    top: StewiePayBrand.spacing.md,
    right: StewiePayBrand.spacing.md,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: StewiePayBrand.spacing.lg,
  },
});

