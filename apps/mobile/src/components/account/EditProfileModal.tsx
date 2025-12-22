import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BottomSheet } from '../modern/BottomSheet';
import { StewieText } from '../stewiepay/StewieText';
import { BrandButton } from '../BrandButton';
import { StewiePayBrand } from '../../brand/StewiePayBrand';
import { UserAPI } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  onUpdate,
}) => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [visible, user]);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await UserAPI.updateProfile({ name, email, phone: phone || undefined });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshUser();
      onUpdate?.();
      onClose();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} height={500}>
      <Animated.View entering={FadeInDown.delay(100)}>
        <StewieText variant="headlineSmall" color="primary" weight="bold" style={styles.title}>
          Edit Profile
        </StewieText>
        <StewieText variant="bodyMedium" color="muted" style={styles.subtitle}>
          Update your account information
        </StewieText>

        <View style={styles.form}>
          {/* Name */}
          <View style={styles.inputGroup}>
            <StewieText variant="labelMedium" color="muted" style={styles.label}>
              Full Name
            </StewieText>
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color={StewiePayBrand.colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={StewiePayBrand.colors.textMuted}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <StewieText variant="labelMedium" color="muted" style={styles.label}>
              Email Address
            </StewieText>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={StewiePayBrand.colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={StewiePayBrand.colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <StewieText variant="labelMedium" color="muted" style={styles.label}>
              Phone Number (Optional)
            </StewieText>
            <View style={styles.inputContainer}>
              <Ionicons
                name="call-outline"
                size={20}
                color={StewiePayBrand.colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor={StewiePayBrand.colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <BrandButton
            label={loading ? 'Saving...' : 'Save Changes'}
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
  actions: {
    marginTop: StewiePayBrand.spacing.lg,
  },
  saveButton: {
    marginTop: StewiePayBrand.spacing.md,
  },
});

