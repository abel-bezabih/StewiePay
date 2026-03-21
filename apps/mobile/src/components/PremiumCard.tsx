import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Text';
import { useTheme } from '../theme';
import * as Haptics from 'expo-haptics';

type CardType = 'PERMANENT' | 'BURNER' | 'MERCHANT_LOCKED' | 'SUBSCRIPTION_ONLY' | 'ADS_ONLY';

const cardGradients: Record<CardType, string[]> = {
  PERMANENT: ['#667EEA', '#764BA2'],
  BURNER: ['#F093FB', '#F5576C'],
  MERCHANT_LOCKED: ['#4FACFE', '#00F2FE'],
  SUBSCRIPTION_ONLY: ['#43E97B', '#38F9D7'],
  ADS_ONLY: ['#FA709A', '#FEE140']
};

type Props = {
  cardNumber: string;
  cardholderName: string;
  type: CardType;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  balance?: number;
  currency?: string;
  onPress?: () => void;
};

export const PremiumCard = ({
  cardNumber,
  cardholderName,
  type,
  status,
  balance,
  currency = 'ETB',
  onPress
}: Props) => {
  const { spacing, radius } = useTheme();
  const gradient = (cardGradients[type] || cardGradients.PERMANENT) as [string, string];
  const isFrozen = status === 'FROZEN';

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const formatCardNumber = (num: string) => {
    const cleaned = num.replace(/\s/g, '');
    return cleaned.match(/.{1,4}/g)?.join(' ') || num;
  };

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
      <View style={[styles.shadow, { marginBottom: spacing(3) }]}>
        <LinearGradient
          colors={isFrozen ? (['#4B5563', '#374151'] as [string, string]) : gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.card,
            {
              borderRadius: radius.lg + 4,
              padding: spacing(5),
              opacity: isFrozen ? 0.7 : 1
            }
          ]}
        >
          {/* Card Header */}
          <View style={styles.header}>
            <View style={styles.chip} />
            {isFrozen && (
              <View style={styles.frozenBadge}>
                <Text style={styles.frozenText}>FROZEN</Text>
              </View>
            )}
          </View>

          {/* Card Number */}
          <View style={{ marginTop: spacing(6), marginBottom: spacing(4) }}>
            <Text
              style={[
                styles.cardNumber,
                { fontSize: 24, letterSpacing: 2, fontWeight: '600' }
              ]}
            >
              {formatCardNumber(cardNumber)}
            </Text>
          </View>

          {/* Card Footer */}
          <View style={styles.footer}>
            <View>
              <Text style={[styles.label, { fontSize: 10, opacity: 0.8 }]}>CARDHOLDER</Text>
              <Text style={[styles.cardholder, { fontSize: 14, marginTop: 4 }]}>
                {cardholderName.toUpperCase()}
              </Text>
            </View>
            {balance !== undefined && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.label, { fontSize: 10, opacity: 0.8 }]}>BALANCE</Text>
                <Text style={[styles.balance, { fontSize: 18, marginTop: 4, fontWeight: '700' }]}>
                  {currency} {balance.toLocaleString()}
                </Text>
              </View>
            )}
          </View>

          {/* Card Type Badge */}
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{type.replace('_', ' ')}</Text>
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8
  },
  card: {
    minHeight: 200,
    justifyContent: 'space-between'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  chip: {
    width: 40,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6
  },
  frozenBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  frozenText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1
  },
  cardNumber: {
    color: '#FFF',
    fontFamily: 'monospace'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 20
  },
  label: {
    color: '#FFF',
    letterSpacing: 1
  },
  cardholder: {
    color: '#FFF',
    fontWeight: '600'
  },
  balance: {
    color: '#FFF'
  },
  typeBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  typeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  }
});















