import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme';
import * as Haptics from 'expo-haptics';

type Props = {
  icon?: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const EmptyState = ({ icon, title, subtitle, actionLabel, onAction }: Props) => {
  const { colors, spacing, radius } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAction?.();
  };

  return (
    <View style={[styles.container, { paddingVertical: spacing(8) }]}>
      {icon && (
        <View style={[styles.iconContainer, { marginBottom: spacing(4) }]}>
          <Text style={{ fontSize: 48 }}>{icon}</Text>
        </View>
      )}
      <Text variant="title" style={{ textAlign: 'center', marginBottom: spacing(2) }}>
        {title}
      </Text>
      <Text variant="muted" style={{ textAlign: 'center', marginBottom: spacing(6) }}>
        {subtitle}
      </Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={handlePress}
          style={[
            styles.button,
            {
              backgroundColor: colors.accent,
              borderRadius: radius.lg,
              paddingVertical: spacing(3),
              paddingHorizontal: spacing(6)
            }
          ]}
        >
          <Text style={{ color: '#0B1224', fontWeight: '700', fontSize: 16 }}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32
  },
  iconContainer: {
    opacity: 0.6
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center'
  }
});







