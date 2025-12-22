import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Alert, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BottomSheet } from '../modern/BottomSheet';
import { StewieText } from '../stewiepay/StewieText';
import { BrandButton } from '../BrandButton';
import { StewiePayBrand } from '../../brand/StewiePayBrand';
import { UserAPI } from '../../api/client';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      Alert.alert('Error', validationError);
      return;
    }

    setLoading(true);
    try {
      await UserAPI.changePassword({
        currentPassword,
        newPassword,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Password changed successfully', [
        {
          text: 'OK',
          onPress: () => {
            handleClose();
            onSuccess?.();
          },
        },
      ]);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to change password. Please check your current password and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose} height={550}>
      <Animated.View entering={FadeInDown.delay(100)}>
        <StewieText variant="headlineSmall" color="primary" weight="bold" style={styles.title}>
          Change Password
        </StewieText>
        <StewieText variant="bodyMedium" color="muted" style={styles.subtitle}>
          Enter your current password and choose a new one
        </StewieText>

        <View style={styles.form}>
          {/* Current Password */}
          <View style={styles.inputGroup}>
            <StewieText variant="labelMedium" color="muted" style={styles.label}>
              Current Password
            </StewieText>
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={StewiePayBrand.colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={StewiePayBrand.colors.textMuted}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showCurrentPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={StewiePayBrand.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <StewieText variant="labelMedium" color="muted" style={styles.label}>
              New Password
            </StewieText>
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={StewiePayBrand.colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={StewiePayBrand.colors.textMuted}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={StewiePayBrand.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
            <StewieText variant="bodySmall" color="muted" style={styles.hint}>
              Must be at least 8 characters with uppercase, lowercase, and number
            </StewieText>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <StewieText variant="labelMedium" color="muted" style={styles.label}>
              Confirm New Password
            </StewieText>
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={StewiePayBrand.colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={StewiePayBrand.colors.textMuted}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={StewiePayBrand.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <BrandButton
            label={loading ? 'Changing...' : 'Change Password'}
            onPress={handleSave}
            fullWidth
            disabled={loading}
            style={styles.saveButton}
          />
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
  form: {
    marginBottom: StewiePayBrand.spacing.xl,
  },
  inputGroup: {
    marginBottom: StewiePayBrand.spacing.lg,
  },
  label: {
    marginBottom: StewiePayBrand.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: StewiePayBrand.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: StewiePayBrand.spacing.md,
    height: 52,
  },
  inputIcon: {
    marginRight: StewiePayBrand.spacing.sm,
  },
  input: {
    flex: 1,
    color: StewiePayBrand.colors.textPrimary,
    fontSize: 16,
    fontFamily: StewiePayBrand.typography.fontFamily.regular,
  },
  eyeButton: {
    padding: StewiePayBrand.spacing.xs,
  },
  hint: {
    marginTop: StewiePayBrand.spacing.xs,
    fontStyle: 'italic',
  },
  actions: {
    marginTop: StewiePayBrand.spacing.lg,
  },
  saveButton: {
    marginTop: StewiePayBrand.spacing.md,
  },
});

