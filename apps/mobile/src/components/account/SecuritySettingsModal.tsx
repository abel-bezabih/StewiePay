import React, { useState } from 'react';
import { View, StyleSheet, Switch, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BottomSheet } from '../modern/BottomSheet';
import { StewieText } from '../stewiepay/StewieText';
import { StewiePayBrand } from '../../brand/StewiePayBrand';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

interface SecuritySettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const handleTwoFactorToggle = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (value) {
      Alert.alert(
        'Two-Factor Authentication',
        'Two-factor authentication setup will be available soon. This feature is coming in a future update.',
        [{ text: 'OK' }]
      );
    } else {
      setTwoFactorEnabled(value);
    }
  };

  const handleBiometricToggle = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (value) {
      Alert.alert(
        'Biometric Authentication',
        'Biometric authentication setup will be available soon. This feature is coming in a future update.',
        [{ text: 'OK' }]
      );
    } else {
      setBiometricEnabled(value);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} height={400}>
      <Animated.View entering={FadeInDown.delay(100)}>
        <StewieText variant="headlineSmall" color="primary" weight="bold" style={styles.title}>
          Security Settings
        </StewieText>
        <StewieText variant="bodyMedium" color="muted" style={styles.subtitle}>
          Manage your account security preferences
        </StewieText>

        <View style={styles.settings}>
          {/* Two-Factor Authentication */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={22}
                  color={StewiePayBrand.colors.primary}
                />
              </View>
              <View style={styles.settingText}>
                <StewieText variant="bodyLarge" color="primary" weight="medium">
                  Two-Factor Authentication
                </StewieText>
                <StewieText variant="bodySmall" color="muted" style={styles.settingDescription}>
                  Add an extra layer of security
                </StewieText>
              </View>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={handleTwoFactorToggle}
              trackColor={{
                false: StewiePayBrand.colors.surfaceVariant,
                true: StewiePayBrand.colors.primary + '40',
              }}
              thumbColor={twoFactorEnabled ? StewiePayBrand.colors.primary : StewiePayBrand.colors.textMuted}
            />
          </View>

          {/* Biometric Authentication */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="finger-print-outline"
                  size={22}
                  color={StewiePayBrand.colors.primary}
                />
              </View>
              <View style={styles.settingText}>
                <StewieText variant="bodyLarge" color="primary" weight="medium">
                  Biometric Authentication
                </StewieText>
                <StewieText variant="bodySmall" color="muted" style={styles.settingDescription}>
                  Use Face ID or Touch ID to sign in
                </StewieText>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{
                false: StewiePayBrand.colors.surfaceVariant,
                true: StewiePayBrand.colors.primary + '40',
              }}
              thumbColor={biometricEnabled ? StewiePayBrand.colors.primary : StewiePayBrand.colors.textMuted}
            />
          </View>

          {/* Session Management */}
          <View style={styles.divider} />
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="desktop-outline"
                  size={22}
                  color={StewiePayBrand.colors.primary}
                />
              </View>
              <View style={styles.settingText}>
                <StewieText variant="bodyLarge" color="primary" weight="medium">
                  Active Sessions
                </StewieText>
                <StewieText variant="bodySmall" color="muted" style={styles.settingDescription}>
                  Manage your logged-in devices
                </StewieText>
              </View>
            </View>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color={StewiePayBrand.colors.textMuted}
            />
          </View>
        </View>
      </Animated.View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  title: {
    marginBottom: StewiePayBrand.spacing.xs,
  },
  subtitle: {
    marginBottom: StewiePayBrand.spacing.xl,
  },
  settings: {
    marginTop: StewiePayBrand.spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: StewiePayBrand.spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: StewiePayBrand.radius.md,
    backgroundColor: StewiePayBrand.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: StewiePayBrand.spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingDescription: {
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: StewiePayBrand.colors.surfaceVariant,
    marginVertical: StewiePayBrand.spacing.sm,
  },
});









