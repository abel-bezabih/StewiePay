import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StewiePayBrand } from '../../brand/StewiePayBrand';
import { StewieText } from './StewieText';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = 220;

interface StewiePaymentCardProps {
  cardNumber?: string;
  cardholderName?: string;
  type?: string;
  status?: string;
  balance?: number;
  currency?: string;
  onPress?: () => void;
  gradient?: [string, string];
}

const getCardGradient = (type?: string): string[] => {
  const gradients: Record<string, string[]> = {
    PERMANENT: StewiePayBrand.colors.gradients.primary,
    BURNER: StewiePayBrand.colors.gradients.primary,
    MERCHANT_LOCKED: StewiePayBrand.colors.gradients.secondary,
    SUBSCRIPTION_ONLY: StewiePayBrand.colors.gradients.success,
    ADS_ONLY: [StewiePayBrand.colors.warning, StewiePayBrand.colors.warningDark], // Orange gradient to match icon
  };
  return gradients[type || 'PERMANENT'] || gradients.PERMANENT;
};

const formatCardType = (type?: string): string => {
  if (!type) return 'Permanent';
  return type
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

const formatStatus = (status?: string): string => {
  if (!status) return 'Active';
  return status.charAt(0) + status.slice(1).toLowerCase();
};

const getStatusColor = (status?: string): string => {
  const statusUpper = (status || 'ACTIVE').toUpperCase();
  switch (statusUpper) {
    case 'ACTIVE':
      return 'rgba(16, 185, 129, 0.8)'; // Success green
    case 'FROZEN':
      return 'rgba(107, 114, 128, 0.8)'; // Gray
    case 'LIMITED':
      return 'rgba(245, 158, 11, 0.8)'; // Warning amber
    default:
      return 'rgba(255, 255, 255, 0.6)'; // Default white
  }
};

/**
 * StewiePaymentCard - Premium payment card component
 * 
 * Features:
 * - Beautiful gradient backgrounds
 * - Large, bold balance display
 * - Card number with proper spacing
 * - Status indicators
 * - Smooth animations
 */
export const StewiePaymentCard: React.FC<StewiePaymentCardProps> = ({
  cardNumber = '4242 4242 4242 4242',
  cardholderName = 'Cardholder',
  type = 'PERMANENT',
  status = 'ACTIVE',
  balance = 0,
  currency = 'ETB',
  onPress,
  gradient,
}) => {
  const cardGradient = (gradient || getCardGradient(type)) as [string, string];
  const isFrozen = status === 'FROZEN';
  const formattedCardNumber = cardNumber.match(/.{1,4}/g)?.join(' ') || cardNumber;

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress} 
      disabled={!onPress}
      style={styles.container}
    >
      <Animatable.View
        animation="fadeInUp"
        duration={600}
        style={styles.cardContainer}
      >
        <LinearGradient
          colors={isFrozen ? (['#4B5563', '#6B7280'] as [string, string]) : cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Top Row: Chip and Metadata */}
          <View style={styles.topRow}>
            <View style={styles.chipContainer}>
              <View style={styles.chip} />
            </View>
            <View style={styles.metadataContainer}>
              <StewieText
                variant="labelSmall"
                color="onPrimary"
                style={styles.metadataText}
              >
                {formatCardType(type)}
              </StewieText>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
              <StewieText
                variant="labelSmall"
                color="onPrimary"
                style={styles.metadataText}
              >
                {formatStatus(status)}
              </StewieText>
            </View>
          </View>

          {/* Card Number */}
          <View style={styles.cardNumberContainer}>
            <StewieText
              variant="titleLarge"
              color="onPrimary"
              weight="semibold"
              style={styles.cardNumber}
            >
              {formattedCardNumber}
            </StewieText>
          </View>

          {/* Balance - Large, Bold, Prominent */}
          {balance !== undefined && (
            <View style={styles.balanceContainer}>
              <StewieText
                variant="displaySmall"
                color="onPrimary"
                weight="black"
                style={styles.balanceAmount}
              >
                {currency} {balance.toLocaleString()}
              </StewieText>
            </View>
          )}

          {/* Cardholder Name */}
          <View style={styles.footer}>
            <View style={styles.cardholderContainer}>
              <StewieText
                variant="labelLarge"
                color="onPrimary"
                weight="bold"
                style={styles.cardholderName}
              >
                {cardholderName.toUpperCase()}
              </StewieText>
            </View>
          </View>

          {/* Decorative Elements */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
        </LinearGradient>
      </Animatable.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginHorizontal: StewiePayBrand.spacing.md,
    marginVertical: StewiePayBrand.spacing.sm,
  },
  cardContainer: {
    width: '100%',
    height: '100%',
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: StewiePayBrand.radius['2xl'],
    padding: StewiePayBrand.spacing.lg,
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...StewiePayBrand.shadows.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: StewiePayBrand.spacing.md,
  },
  chipContainer: {
    alignItems: 'flex-start',
  },
  chip: {
    width: 50,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: StewiePayBrand.radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  metadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: StewiePayBrand.spacing.sm,
    paddingVertical: StewiePayBrand.spacing.xs,
    borderRadius: StewiePayBrand.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  metadataText: {
    opacity: 0.85,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: StewiePayBrand.spacing.xs,
  },
  cardNumberContainer: {
    marginBottom: StewiePayBrand.spacing.md,
  },
  cardNumber: {
    letterSpacing: 3,
    opacity: 0.95,
  },
  balanceContainer: {
    marginBottom: StewiePayBrand.spacing.lg,
    marginTop: StewiePayBrand.spacing.sm,
  },
  balanceAmount: {
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardholderContainer: {
    flex: 1,
  },
  cardholderName: {
    letterSpacing: 1,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -50,
    right: -50,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    bottom: -30,
    left: -30,
  },
});




