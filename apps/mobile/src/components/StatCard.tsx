import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme';

type Props = {
  label: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  icon?: string;
};

export const StatCard = ({ label, value, trend, icon }: Props) => {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          padding: spacing(4),
          borderWidth: 1,
          borderColor: colors.border
        }
      ]}
    >
      {icon && (
        <Text style={{ fontSize: 24, marginBottom: spacing(2) }}>{icon}</Text>
      )}
      <Text variant="muted" style={{ fontSize: 12, marginBottom: spacing(1) }}>
        {label}
      </Text>
      <Text variant="title" style={{ fontSize: 28, fontWeight: '700', marginBottom: spacing(1) }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
      {trend && (
        <View style={styles.trend}>
          <Text
            style={{
              fontSize: 12,
              color: trend.isPositive ? colors.success : colors.danger,
              fontWeight: '600'
            }}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 120
  },
  trend: {
    marginTop: 4
  }
});















