import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, Alert, ActivityIndicator, TouchableOpacity, Image, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BottomSheet } from '../modern/BottomSheet';
import { StewieText } from '../stewiepay/StewieText';
import { BrandButton } from '../BrandButton';
import { StewiePayBrand } from '../../brand/StewiePayBrand';
import { UserAPI } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

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
  const [avatarUrl, setAvatarUrl] = useState((user as any)?.avatarUrl || '');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (visible && user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatarUrl((user as any)?.avatarUrl || '');
      setSelectedImageUri(null); // Reset selected image when modal opens
    }
  }, [visible, user]);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Just set the preview, don't upload yet
        setSelectedImageUri(result.assets[0].uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleUploadImage = async () => {
    if (!selectedImageUri) return;

    setUploading(true);
    try {
      // Convert image to base64 using legacy API (to avoid deprecation warning)
      const base64 = await FileSystem.readAsStringAsync(selectedImageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Upload to backend (which uploads to Cloudinary and updates the user's avatarUrl)
      const uploadResponse = await UserAPI.uploadAvatar(base64);
      setAvatarUrl(uploadResponse.data.avatarUrl);
      setSelectedImageUri(null); // Clear selected image after successful upload
      
      // Refresh user context so avatar shows immediately in HomeScreen and AccountScreen
      await refreshUser();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Photo uploaded successfully!');
    } catch (uploadError: any) {
      console.error('Upload error:', uploadError);
      Alert.alert('Upload Error', uploadError.response?.data?.message || 'Failed to upload image. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setUploading(false);
    }
  };

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
      await UserAPI.updateProfile({ 
        name, 
        email, 
        phone: phone || undefined,
        avatarUrl: avatarUrl || undefined
      });
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

        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <TouchableOpacity
            onPress={handlePickImage}
            disabled={uploading}
            style={styles.photoContainer}
            activeOpacity={0.8}
          >
            {selectedImageUri ? (
              <Image source={{ uri: selectedImageUri }} style={styles.photo} />
            ) : avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={40} color={StewiePayBrand.colors.textMuted} />
              </View>
            )}
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
            <View style={styles.photoEditBadge}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <StewieText variant="bodySmall" color="muted" style={styles.photoHint}>
            Tap to select photo
          </StewieText>
          {selectedImageUri && (
            <BrandButton
              label={uploading ? 'Uploading...' : 'Set Photo'}
              onPress={handleUploadImage}
              disabled={uploading}
              style={styles.setPhotoButton}
              variant="secondary"
            />
          )}
        </View>

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
    marginBottom: StewiePayBrand.spacing.lg,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: StewiePayBrand.spacing.xl,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: StewiePayBrand.spacing.sm,
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: StewiePayBrand.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: StewiePayBrand.colors.surfaceVariant,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: StewiePayBrand.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  photoHint: {
    textAlign: 'center',
    marginBottom: StewiePayBrand.spacing.sm,
  },
  setPhotoButton: {
    marginTop: StewiePayBrand.spacing.sm,
    minWidth: 120,
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
    fontFamily: StewiePayBrand.typography.fontFamily.body,
  },
  actions: {
    marginTop: StewiePayBrand.spacing.lg,
  },
  saveButton: {
    marginTop: StewiePayBrand.spacing.md,
  },
});


