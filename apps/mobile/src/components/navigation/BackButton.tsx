import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, Platform, StatusBar, Dimensions, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StewiePayBrand } from '../../brand/StewiePayBrand';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';

// Calculate safe top inset as fallback
const getSafeTopInsetFallback = () => {
  if (Platform.OS === 'ios') {
    // iOS: Account for status bar + notch/Dynamic Island
    const { height: SCREEN_HEIGHT } = Dimensions.get('window');
    return SCREEN_HEIGHT > 800 ? 50 : 44; // Taller screens likely have notch
  } else {
    // Android: Use StatusBar height + some padding
    return (StatusBar.currentHeight || 24) + 8;
  }
};

interface BackButtonProps {
  onPress?: () => void;
  style?: ViewStyle;
  animated?: boolean;
  topOffset?: number; // Optional custom top offset
}

/**
 * Modern Back Button Component
 * 
 * Features:
 * - Elegant glassmorphic design
 * - Haptic feedback
 * - Smooth animations
 * - Consistent with brand design
 */
export const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  style,
  animated = true,
  topOffset,
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  // Use safe area insets if available, otherwise fallback
  // Position button at the top, titles and content will be below it
  const safeTop = topOffset !== undefined 
    ? topOffset 
    : insets.top > 0 
      ? insets.top + StewiePayBrand.spacing.sm // Small padding from safe area top
      : getSafeTopInsetFallback() + StewiePayBrand.spacing.xs;

  const handlePress = () => {
    console.log('BackButton: Press detected!');
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log('BackButton: Haptic triggered');
      if (onPress) {
        console.log('BackButton: Calling custom onPress');
        onPress();
      } else if (navigation && navigation.canGoBack && navigation.canGoBack()) {
        console.log('BackButton: Navigating back');
        navigation.goBack();
      } else {
        console.warn('BackButton: Cannot go back - no previous screen');
      }
    } catch (error) {
      console.error('BackButton press error:', error);
    }
  };

  const buttonStyle = [
    styles.container,
    styles.button,
    { top: safeTop },
    style
  ];

  const ButtonContent = (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        buttonStyle,
        { opacity: pressed ? 0.6 : 1 }
      ]}
      hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }}
    >
      <Ionicons
        name="arrow-back"
        size={20}
        color={StewiePayBrand.colors.textPrimary}
      />
    </Pressable>
  );

  // Don't wrap in Animated.View if it might block touches
  return ButtonContent;
};

// Export the safe top inset calculation for use in screen styles
export { getSafeTopInsetFallback as getSafeTopInset };

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: StewiePayBrand.spacing.lg,
    zIndex: 9999, // Maximum z-index to ensure it's always on top
    width: 40,
    height: 40,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: StewiePayBrand.radius.lg,
    backgroundColor: 'rgba(10, 10, 10, 0.9)', // Solid dark background for better touch handling
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    // Strong shadow for visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 15,
  },
});

