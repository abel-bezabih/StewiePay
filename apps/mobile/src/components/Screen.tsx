import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
};

export const Screen = ({ children, scroll = false, style }: Props) => {
  const { colors, spacing } = useTheme();
  const content = (
    <View style={[styles.container, { backgroundColor: colors.background, padding: spacing(5) }, style]}>
      {children}
    </View>
  );
  if (scroll) {
    return <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>{content}</ScrollView>;
  }
  return content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});












