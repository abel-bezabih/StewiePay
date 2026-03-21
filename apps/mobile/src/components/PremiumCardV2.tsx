import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { StewiePayBrand } from '../brand/StewiePayBrand';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = 220;

interface PremiumCardV2Props {
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
    PERMANENT: ['#667EEA', '#764BA2'],
    BURNER: ['#F093FB', '#F5576C'],
    MERCHANT_LOCKED: ['#4FACFE', '#00F2FE'],
    SUBSCRIPTION_ONLY: ['#43E97B', '#38F9D7'],
    ADS_ONLY: ['#FA709A', '#FEE140']
  };
  return gradients[type || 'PERMANENT'] || gradients.PERMANENT;
};

export const PremiumCardV2: React.FC<PremiumCardV2Props> = ({
  cardNumber = '4242 4242 4242 4242',
  cardholderName = 'Cardholder',
  type = 'PERMANENT',
  status = 'ACTIVE',
  balance = 0,
  currency = 'ETB',
  onPress,
  gradient
}) => {
  const cardGradient = (gradient || getCardGradient(type)) as [string, string];
  const isFrozen = status === 'FROZEN';

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} disabled={!onPress}>
      <Animatable.View
        animation="fadeInUp"
        duration={600}
        style={styles.container}
      >
        <LinearGradient
          colors={isFrozen ? (['#4B5563', '#6B7280'] as [string, string]) : cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Card Chip */}
          <View style={styles.chipContainer}>
            <View style={styles.chip} />
          </View>

          {/* Card Number */}
          <View style={styles.cardNumberContainer}>
            <Animatable.Text
              animation="fadeIn"
              delay={200}
              style={styles.cardNumber}
            >
              {cardNumber.match(/.{1,4}/g)?.join(' ') || cardNumber}
            </Animatable.Text>
          </View>

          {/* Balance - Revolut Style: Large, Bold, Prominent */}
          {balance !== undefined && (
            <View style={styles.balanceContainer}>
              <Animatable.Text
                animation="fadeIn"
                delay={400}
                style={styles.balanceAmount}
              >
                {currency} {balance.toLocaleString()}
              </Animatable.Text>
            </View>
          )}

          {/* Cardholder Name & Status */}
          <View style={styles.footer}>
            <View style={styles.cardholderContainer}>
              <Animatable.Text
                animation="fadeIn"
                delay={500}
                style={styles.cardholderName}
              >
                {cardholderName.toUpperCase()}
              </Animatable.Text>
              <Animatable.Text
                animation="fadeIn"
                delay={600}
                style={styles.cardType}
              >
                {type.replace('_', ' ')}
              </Animatable.Text>
            </View>
            {isFrozen && (
              <Animatable.View
                animation="pulse"
                iterationCount="infinite"
                style={styles.frozenBadge}
              >
                <Animatable.Text style={styles.frozenText}>❄️ FROZEN</Animatable.Text>
              </Animatable.View>
            )}
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
    marginHorizontal: 20,
    marginVertical: 10
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
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
    fontSize: 20, // Slightly smaller to give balance more prominence
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 3, // More spacing like Revolut
    fontFamily: 'monospace',
    opacity: 0.95
  },
  balanceContainer: {
    marginBottom: 24,
    marginTop: 8
  },
  balanceAmount: {
    fontSize: 42, // Larger like Revolut
    fontWeight: '900', // Bolder
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



