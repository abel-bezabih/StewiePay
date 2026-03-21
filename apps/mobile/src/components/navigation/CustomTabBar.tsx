import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StewiePayBrand } from '../../brand/StewiePayBrand';
import { LinearGradient } from 'expo-linear-gradient';

export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.container}>
      {/* Rounded container for tab bar */}
      <View style={styles.tabBarContainer}>
        {/* Left Group: Home and Cards */}
        <View style={styles.leftGroup}>
          {state.routes.slice(0, 2).map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const label = options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const iconName = route.name === 'Home' 
              ? (isFocused ? 'home' : 'home-outline')
              : 'wallet-outline';

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                style={styles.tabItem}
              >
                <Ionicons
                  name={iconName as any}
                  size={22}
                  color={isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
                />
                <View style={[styles.labelContainer, isFocused && styles.labelContainerActive]}>
                  <View style={[styles.labelDot, isFocused && styles.labelDotActive]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Center FAB Button - Elevated above bar */}
        {/* Spacer to maintain layout spacing */}
        <View style={styles.fabSpacer}>
          <View style={styles.fabContainer}>
            <TouchableOpacity
              onPress={() => navigation.navigate('TopUp')}
              activeOpacity={0.8}
              style={styles.fab}
            >
              <LinearGradient
                colors={[StewiePayBrand.colors.primary, StewiePayBrand.colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fabGradient}
              >
                <Ionicons name="add" size={28} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Right Group: Activities and More */}
        <View style={styles.rightGroup}>
          {state.routes.slice(3, 5).map((route, index) => {
            const actualIndex = index + 3; // Adjust index for state
            const { options } = descriptors[route.key];
            const isFocused = state.index === actualIndex;
            const label = options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const iconName = route.name === 'Activities'
              ? 'receipt-outline'
              : 'grid-outline';

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                style={styles.tabItem}
              >
                <Ionicons
                  name={iconName as any}
                  size={22}
                  color={isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
                />
                <View style={[styles.labelContainer, isFocused && styles.labelContainerActive]}>
                  <View style={[styles.labelDot, isFocused && styles.labelDotActive]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 12 : 8,
    left: StewiePayBrand.spacing.md,
    right: StewiePayBrand.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center content
    backgroundColor: '#7C3AED',
    borderRadius: 28,
    paddingHorizontal: StewiePayBrand.spacing.xs, // Minimal padding
    paddingVertical: StewiePayBrand.spacing.sm,
    height: Platform.OS === 'ios' ? 72 : 64,
    ...StewiePayBrand.shadows.lg,
    elevation: 8,
    width: '85%', // More compact - reduced from 88%
    maxWidth: 360, // Reduced from 380
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // Align to right edge of group (closer to center)
    gap: StewiePayBrand.spacing.xs, // Reduced gap from sm to xs (4px)
    marginRight: StewiePayBrand.spacing.xs, // Small margin to bring closer to FAB
    flexShrink: 1, // Allow shrinking instead of flex: 1
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // Align to left edge of group (closer to center)
    gap: StewiePayBrand.spacing.xs, // Reduced gap from sm to xs (4px)
    marginLeft: StewiePayBrand.spacing.xs, // Small margin to bring closer to FAB
    flexShrink: 1, // Allow shrinking instead of flex: 1
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: StewiePayBrand.spacing.xs, // Reduced from sm to xs
    paddingVertical: StewiePayBrand.spacing.xs,
    minWidth: 45, // Reduced from 50
  },
  labelContainer: {
    marginTop: 4,
    height: 3,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainerActive: {
    height: 3,
  },
  labelDot: {
    width: 0,
    height: 0,
    borderRadius: 1.5,
    backgroundColor: 'transparent',
  },
  labelDotActive: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
  },
  fabSpacer: {
    width: 56, // Same width as FAB to maintain spacing
    height: 56, // Same height as FAB
    alignItems: 'center',
    justifyContent: 'flex-start', // Align to top so FAB can extend upward
    marginHorizontal: StewiePayBrand.spacing.xs,
  },
  fabContainer: {
    position: 'absolute',
    top: -18, // Move FAB higher above the bar (increased from -12)
    alignSelf: 'center',
    zIndex: 10,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    ...StewiePayBrand.shadows.lg,
    elevation: 12,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: StewiePayBrand.colors.primary,
  },
});

