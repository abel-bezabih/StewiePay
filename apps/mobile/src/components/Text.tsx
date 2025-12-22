import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

type Variant = 'title' | 'subtitle' | 'body' | 'muted' | 'label';

type Props = TextProps & {
  variant?: Variant;
};

export const Text = ({ variant = 'body', style, ...rest }: Props) => {
  const { colors } = useTheme();
  return (
    <RNText
      style={[
        styles.base,
        variant === 'title' && styles.title,
        variant === 'subtitle' && styles.subtitle,
        variant === 'muted' && { color: colors.muted },
        variant === 'label' && styles.label,
        { color: colors.text },
        style
      ]}
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    fontSize: 16
  },
  title: {
    fontSize: 28,
    fontWeight: '700'
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600'
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontSize: 12
  }
});












