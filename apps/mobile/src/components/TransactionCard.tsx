import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { GlassmorphicCard } from './GlassmorphicCard';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { getCategoryIcon, getCategoryColor } from '../utils/category-utils';
import * as Haptics from 'expo-haptics';

interface TransactionCardProps {
  transaction: any;
  onPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onPress,
  onSwipeLeft,
  onSwipeRight
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, StewiePayBrand.animation.spring);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, StewiePayBrand.animation.spring);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value
    };
  });

  const categoryIcon = getCategoryIcon(transaction.category);
  const categoryColor = getCategoryColor(transaction.category);
  const isNegative = transaction.amount < 0;
  const amount = Math.abs(transaction.amount);

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderRightActions = () => {
    if (!onSwipeRight) return null;
    return (
      <View style={styles.rightAction}>
        <Text style={styles.actionText}>View</Text>
      </View>
    );
  };

  const renderLeftActions = () => {
    if (!onSwipeLeft) return null;
    return (
      <View style={styles.leftAction}>
        <Text style={styles.actionText}>Delete</Text>
      </View>
    );
  };

  const cardContent = (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.card}>
        <View style={styles.content}>
          {/* Category Icon & Merchant - Revolut Style */}
          <View style={styles.leftSection}>
            <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}15` }]}>
              <Text style={styles.icon}>{categoryIcon}</Text>
            </View>
            <View style={styles.merchantInfo}>
              <Text style={styles.merchant} numberOfLines={1}>
                {transaction.merchantName || 'Unknown Merchant'}
              </Text>
              <Text style={styles.date}>
                {formatDate(transaction.createdAt)}
              </Text>
            </View>
          </View>

          {/* Amount - Revolut Style: Large, Bold, Right-aligned */}
          <View style={styles.rightSection}>
            <Text
              style={[
                styles.amount,
                { color: isNegative ? '#FFFFFF' : '#00D9FF' } // White for negative, cyan for positive
              ]}
            >
              {isNegative ? '-' : '+'}ETB {amount.toLocaleString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  if (onSwipeLeft || onSwipeRight) {
    return (
      <GestureHandlerRootView>
        <Swipeable
          renderRightActions={renderRightActions}
          renderLeftActions={renderLeftActions}
          onSwipeableOpen={(direction) => {
            if (direction === 'left' && onSwipeLeft) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onSwipeLeft();
            } else if (direction === 'right' && onSwipeRight) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onSwipeRight();
            }
          }}
        >
          {cardContent}
        </Swipeable>
      </GestureHandlerRootView>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A', // Dark gray like Revolut
    marginHorizontal: 20,
    marginVertical: 6, // Tighter spacing
    borderRadius: 16,
    padding: 16
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  icon: {
    fontSize: 22
  },
  merchantInfo: {
    flex: 1
  },
  merchant: {
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    fontSize: 16
  },
  date: {
    color: '#999999', // Lighter gray for date
    fontSize: 13
  },
  rightSection: {
    alignItems: 'flex-end'
  },
  amount: {
    fontWeight: '700',
    fontSize: 18 // Larger amount
  },
  rightAction: {
    backgroundColor: StewiePayBrand.colors.primary,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: StewiePayBrand.spacing.lg,
    marginVertical: StewiePayBrand.spacing.sm,
    borderRadius: StewiePayBrand.radius.lg,
    marginRight: StewiePayBrand.spacing.lg
  },
  leftAction: {
    backgroundColor: StewiePayBrand.colors.error,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: StewiePayBrand.spacing.lg,
    marginVertical: StewiePayBrand.spacing.sm,
    borderRadius: StewiePayBrand.radius.lg,
    marginLeft: StewiePayBrand.spacing.lg
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
    fontSize: StewiePayBrand.typography.fontSize.base
  }
});

