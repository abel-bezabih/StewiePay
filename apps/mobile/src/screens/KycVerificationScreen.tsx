import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { UserAPI } from '../api/client';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieCard } from '../components/stewiepay/StewieCard';
import { StewieText } from '../components/stewiepay/StewieText';
import { StewieButton } from '../components/stewiepay/StewieButton';
import { BackButton } from '../components/navigation/BackButton';
import { useAuth } from '../contexts/AuthContext';

type KycReviewEvent = {
  id: string;
  previousStatus: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  newStatus: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
};

export const KycVerificationScreen = ({ navigation }: any) => {
  const { user, refreshUser } = useAuth();
  const [documentType, setDocumentType] = useState<'passport' | 'national_id' | 'driver_license'>('passport');
  const [country, setCountry] = useState('Ethiopia');
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [frontBase64, setFrontBase64] = useState<string | null>(null);
  const [backBase64, setBackBase64] = useState<string | null>(null);
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [missingFront, setMissingFront] = useState(false);
  const [missingSelfie, setMissingSelfie] = useState(false);
  const [kycStatus, setKycStatus] = useState<'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED'>('PENDING');
  const [kycRejectionReason, setKycRejectionReason] = useState<string | null>(null);
  const [latestReview, setLatestReview] = useState<KycReviewEvent | null>(null);
  const [reviewHistory, setReviewHistory] = useState<KycReviewEvent[]>([]);
  const hasFront = Boolean(frontBase64);
  const hasSelfie = Boolean(selfieBase64);

  const pickImage = async (setter: (uri: string) => void, type: 'front' | 'back') => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setErrorMessage('Permission required to access photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      quality: 0.8,
    });
    const uri = result.assets?.[0]?.uri;
    const base64 = result.assets?.[0]?.base64;
    if (!result.canceled && uri && base64) {
      setter(uri);
      if (type === 'front') setFrontBase64(base64);
      if (type === 'back') setBackBase64(base64);
      if (type === 'front') setMissingFront(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    setErrorMessage('Could not load the selected image. Please try again.');
  };

  const pickSelfie = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPerm.status === 'granted') {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
        quality: 0.8,
      });
      const uri = result.assets?.[0]?.uri;
      const base64 = result.assets?.[0]?.base64;
      if (!result.canceled && uri && base64) {
        setSelfieUri(uri);
        setSelfieBase64(base64);
        setMissingSelfie(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      }
    }

    const libraryPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (libraryPerm.status !== 'granted') {
      setErrorMessage('Camera or photo permission required to take a selfie.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
      quality: 0.8,
    });
    const uri = result.assets?.[0]?.uri;
    const base64 = result.assets?.[0]?.base64;
    if (!result.canceled && uri && base64) {
      setSelfieUri(uri);
      setSelfieBase64(base64);
      setMissingSelfie(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    setErrorMessage('Could not load the selected selfie. Please try again.');
  };

  const submit = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if ((!frontBase64 && !frontUri) || (!selfieBase64 && !selfieUri)) {
        setMissingFront(!frontBase64 && !frontUri);
        setMissingSelfie(!selfieBase64 && !selfieUri);
        const missing: string[] = [];
        if (!frontBase64 && !frontUri) missing.push('document front');
        if (!selfieBase64 && !selfieUri) missing.push('selfie');
        setErrorMessage(`Missing: ${missing.join(' and ')}.`);
        setLoading(false);
        return;
      }
      setMissingFront(false);
      setMissingSelfie(false);

      const resolvedFront = frontBase64 || (frontUri
        ? await FileSystem.readAsStringAsync(frontUri, { encoding: FileSystem.EncodingType.Base64 })
        : null);
      const resolvedBack = backBase64 || (backUri
        ? await FileSystem.readAsStringAsync(backUri, { encoding: FileSystem.EncodingType.Base64 })
        : null);
      const resolvedSelfie = selfieBase64 || (selfieUri
        ? await FileSystem.readAsStringAsync(selfieUri, { encoding: FileSystem.EncodingType.Base64 })
        : null);

      if (!resolvedFront || !resolvedSelfie) {
        setErrorMessage('We could not read one of the images. Please re-select and try again.');
        setLoading(false);
        return;
      }

      await UserAPI.submitKyc({
        documentType,
        country: country.trim(),
        documentFront: resolvedFront,
        documentBack: resolvedBack ?? undefined,
        selfie: resolvedSelfie,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshUser();
      await loadKycStatus();
      setSuccessMessage('Verification submitted and processed successfully.');
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMessage(e?.response?.data?.message || 'Failed to submit verification.');
    } finally {
      setLoading(false);
    }
  };

  const loadKycStatus = async () => {
    try {
      const resp = await UserAPI.getKycStatus();
      setKycStatus(resp.data.kycStatus || 'PENDING');
      setKycRejectionReason(resp.data.kycRejectionReason || null);
      setLatestReview(resp.data.latestReview || null);
    } catch {
      // ignore
    }
  };

  const loadKycReviews = async () => {
    if (!user?.id) {
      return;
    }
    try {
      const resp = await UserAPI.getKycReviews(user.id, { limit: 5 });
      if (Array.isArray(resp.data)) {
        setReviewHistory(resp.data);
      } else {
        setReviewHistory(Array.isArray(resp.data?.items) ? resp.data.items : []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadKycStatus();
    loadKycReviews();
  }, [user?.id]);

  return (
    <View style={styles.container}>
      <BackButton />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <StewieCard elevated style={styles.card}>
        <View style={styles.statusBanner}>
          <View style={styles.statusBannerLeft}>
            <Ionicons
              name={
                kycStatus === 'VERIFIED'
                  ? 'checkmark-circle-outline'
                  : kycStatus === 'REJECTED'
                    ? 'alert-circle-outline'
                    : kycStatus === 'SUBMITTED'
                      ? 'time-outline'
                      : 'document-text-outline'
              }
              size={18}
              color={
                kycStatus === 'VERIFIED'
                  ? StewiePayBrand.colors.success
                  : kycStatus === 'REJECTED'
                    ? StewiePayBrand.colors.error
                    : StewiePayBrand.colors.warning
              }
            />
            <StewieText variant="bodySmall" color="muted" style={{ marginLeft: 8 }}>
              Status: {kycStatus}
            </StewieText>
          </View>
          {kycStatus === 'REJECTED' && kycRejectionReason && (
            <StewieText variant="bodySmall" style={{ color: StewiePayBrand.colors.error }}>
              {kycRejectionReason}
            </StewieText>
          )}
        </View>
        {latestReview && (
          <View style={styles.latestReviewBox}>
            <StewieText variant="labelMedium" color="primary" weight="semibold">
              Latest Review
            </StewieText>
            <StewieText variant="bodySmall" color="muted" style={{ marginTop: 4 }}>
              {new Date(latestReview.createdAt).toLocaleString()} • {latestReview.newStatus}
              {latestReview.reviewer?.name ? ` • by ${latestReview.reviewer.name}` : ''}
            </StewieText>
            {latestReview.reviewNote ? (
              <StewieText variant="bodySmall" color="primary" style={{ marginTop: 6 }}>
                Note: {latestReview.reviewNote}
              </StewieText>
            ) : null}
          </View>
        )}
        <StewieText variant="titleLarge" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.sm }}>
          Identity Verification
        </StewieText>
        <StewieText variant="bodySmall" color="muted" style={{ marginBottom: StewiePayBrand.spacing.md }}>
          Upload your document and a selfie to verify your identity.
        </StewieText>

        <View style={styles.segment}>
          {(['passport', 'national_id', 'driver_license'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.segmentButton,
                documentType === type && styles.segmentButtonActive,
              ]}
              onPress={() => setDocumentType(type)}
            >
              <StewieText
                variant="labelMedium"
                weight={documentType === type ? 'semibold' : 'regular'}
                style={{ color: documentType === type ? StewiePayBrand.colors.primary : StewiePayBrand.colors.textMuted }}
              >
                {type.replace('_', ' ')}
              </StewieText>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputWrapper}>
          <StewieText variant="labelMedium" color="muted" style={styles.inputLabel}>
            Country
          </StewieText>
          <View style={styles.inputBox}>
            <Ionicons name="flag-outline" size={20} color={StewiePayBrand.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="Country"
              placeholderTextColor={StewiePayBrand.colors.textMuted}
              value={country}
              onChangeText={setCountry}
              style={styles.input}
            />
          </View>
        </View>

        <StewieText variant="labelSmall" color="muted" style={styles.helperText}>
          Upload your document photos first, then take a live face photo.
        </StewieText>
        <View style={styles.uploadRow}>
          <UploadCard
            label="Document Front"
            uri={frontUri}
            onPick={() => pickImage((uri) => setFrontUri(uri), 'front')}
            required
            invalid={missingFront}
          />
          <UploadCard
            label="Document Back (optional)"
            uri={backUri}
            onPick={() => pickImage((uri) => setBackUri(uri), 'back')}
          />
        </View>
        <UploadCard
          label="Live Face Photo (Selfie)"
          uri={selfieUri}
          onPick={pickSelfie}
          full
          required
          invalid={missingSelfie}
        />
        <StewieButton
          label="Capture Selfie"
          onPress={pickSelfie}
          variant="secondary"
          size="md"
          fullWidth
          style={styles.captureButton}
        />
        <StewieText variant="labelSmall" color="muted" style={styles.helperText}>
          Required: document front + live face photo. Back side is optional.
        </StewieText>

        <StewieButton
          label={loading ? 'Submitting...' : 'Submit Verification'}
          onPress={submit}
          variant="primary"
          size="lg"
          fullWidth
          disabled={loading || kycStatus === 'SUBMITTED' || kycStatus === 'VERIFIED'}
          style={styles.submitButton}
        />

        {successMessage && (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle-outline" size={16} color={StewiePayBrand.colors.success} />
            <StewieText variant="bodySmall" style={styles.successText}>
              {successMessage}
            </StewieText>
          </View>
        )}

        {errorMessage && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={StewiePayBrand.colors.error} />
            <StewieText variant="bodySmall" style={styles.errorText}>
              {errorMessage}
            </StewieText>
          </View>
        )}

        <View style={styles.reviewSection}>
          <StewieText variant="labelLarge" color="muted" style={{ marginBottom: StewiePayBrand.spacing.sm }}>
            Review History
          </StewieText>
          {reviewHistory.length === 0 ? (
            <StewieText variant="bodySmall" color="muted">
              No review events yet.
            </StewieText>
          ) : (
            reviewHistory.map((event) => (
              <View key={event.id} style={styles.reviewItem}>
                <StewieText variant="labelMedium" color="primary" weight="semibold">
                  {event.newStatus}
                </StewieText>
                <StewieText variant="bodySmall" color="muted" style={{ marginTop: 2 }}>
                  {new Date(event.createdAt).toLocaleString()}
                  {event.reviewer?.name ? ` • ${event.reviewer.name}` : ''}
                </StewieText>
                {event.rejectionReason ? (
                  <StewieText variant="bodySmall" style={{ color: StewiePayBrand.colors.error, marginTop: 4 }}>
                    Reason: {event.rejectionReason}
                  </StewieText>
                ) : null}
                {event.reviewNote ? (
                  <StewieText variant="bodySmall" color="primary" style={{ marginTop: 4 }}>
                    Note: {event.reviewNote}
                  </StewieText>
                ) : null}
              </View>
            ))
          )}
        </View>
      </StewieCard>
      </ScrollView>
    </View>
  );
};

const UploadCard = ({
  label,
  uri,
  onPick,
  full,
  required,
  invalid,
}: {
  label: string;
  uri: string | null;
  onPick: () => void;
  full?: boolean;
  required?: boolean;
  invalid?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPick}
    style={[
      styles.uploadCard,
      full && styles.uploadCardFull,
      invalid && styles.uploadCardInvalid,
    ]}
    activeOpacity={0.8}
  >
    {uri ? (
      <View style={styles.uploadSelected}>
        <Image source={{ uri }} style={styles.uploadImage} />
        <View style={styles.uploadBadge}>
          <Ionicons name="checkmark-circle" size={18} color={StewiePayBrand.colors.success} />
        </View>
      </View>
    ) : (
      <View style={styles.uploadPlaceholder}>
        <Ionicons name="image-outline" size={28} color={StewiePayBrand.colors.textMuted} />
        <StewieText variant="labelSmall" color="muted" style={{ marginTop: StewiePayBrand.spacing.xs }}>
          {label}{required ? ' *' : ''}
        </StewieText>
      </View>
    )}
    <View style={styles.uploadStatus}>
      <Ionicons
        name={uri ? 'checkmark-circle' : 'ellipse-outline'}
        size={14}
        color={uri ? StewiePayBrand.colors.success : StewiePayBrand.colors.textMuted}
      />
      <StewieText variant="labelSmall" color="muted" style={{ marginLeft: 6 }}>
        {uri ? 'Selected' : 'Not selected'}
      </StewieText>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: StewiePayBrand.colors.backgroundSecondary,
    paddingTop: 80,
    paddingHorizontal: StewiePayBrand.spacing.md,
  },
  scrollContent: {
    paddingBottom: StewiePayBrand.spacing.xl,
  },
  card: {
    padding: StewiePayBrand.spacing.lg,
  },
  latestReviewBox: {
    backgroundColor: StewiePayBrand.colors.surface,
    borderWidth: 1,
    borderColor: StewiePayBrand.colors.surfaceVariant,
    borderRadius: StewiePayBrand.radius.md,
    padding: StewiePayBrand.spacing.md,
    marginBottom: StewiePayBrand.spacing.md,
  },
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: StewiePayBrand.colors.surface,
    borderRadius: StewiePayBrand.radius.md,
    borderWidth: 1,
    borderColor: StewiePayBrand.colors.surfaceVariant,
    paddingHorizontal: StewiePayBrand.spacing.md,
    paddingVertical: StewiePayBrand.spacing.sm,
    marginBottom: StewiePayBrand.spacing.md,
  },
  statusBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: StewiePayBrand.colors.surface,
    borderRadius: StewiePayBrand.radius.md,
    padding: StewiePayBrand.spacing.xs,
    marginBottom: StewiePayBrand.spacing.md,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: StewiePayBrand.spacing.sm,
    borderRadius: StewiePayBrand.radius.sm,
  },
  segmentButtonActive: {
    backgroundColor: StewiePayBrand.colors.surfaceElevated,
  },
  inputWrapper: {
    marginBottom: StewiePayBrand.spacing.md,
  },
  inputLabel: {
    marginBottom: StewiePayBrand.spacing.xs,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: StewiePayBrand.colors.surface,
    borderRadius: StewiePayBrand.radius.md,
    borderWidth: 1,
    borderColor: StewiePayBrand.colors.surfaceVariant,
    paddingHorizontal: StewiePayBrand.spacing.md,
    paddingVertical: StewiePayBrand.spacing.sm,
  },
  inputIcon: {
    marginRight: StewiePayBrand.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: StewiePayBrand.typography.styles.bodyMedium.fontSize,
    fontWeight: StewiePayBrand.typography.styles.bodyMedium.fontWeight as '400' | '500' | '600' | '700' | '800' | '900',
    lineHeight: StewiePayBrand.typography.styles.bodyMedium.lineHeight,
    letterSpacing: StewiePayBrand.typography.styles.bodyMedium.letterSpacing,
    color: StewiePayBrand.colors.textPrimary,
  },
  uploadRow: {
    flexDirection: 'row',
    gap: StewiePayBrand.spacing.sm,
    marginBottom: StewiePayBrand.spacing.sm,
  },
  uploadCard: {
    flex: 1,
    height: 120,
    borderRadius: StewiePayBrand.radius.md,
    borderWidth: 1,
    borderColor: StewiePayBrand.colors.surfaceVariant,
    backgroundColor: StewiePayBrand.colors.surface,
    overflow: 'hidden',
  },
  uploadCardInvalid: {
    borderColor: StewiePayBrand.colors.error,
  },
  uploadCardFull: {
    height: 140,
    marginBottom: StewiePayBrand.spacing.md,
  },
  uploadImage: {
    width: '100%',
    height: '100%',
  },
  uploadSelected: {
    flex: 1,
  },
  uploadBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: StewiePayBrand.colors.surface,
    borderRadius: 12,
    padding: 2,
  },
  uploadPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: StewiePayBrand.spacing.sm,
  },
  uploadStatus: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: StewiePayBrand.colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  submitButton: {
    marginTop: StewiePayBrand.spacing.sm,
  },
  captureButton: {
    marginBottom: StewiePayBrand.spacing.sm,
  },
  helperText: {
    marginBottom: StewiePayBrand.spacing.sm,
  },
  successBox: {
    marginTop: StewiePayBrand.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${StewiePayBrand.colors.success}10`,
    borderRadius: StewiePayBrand.radius.md,
    borderWidth: 1,
    borderColor: `${StewiePayBrand.colors.success}40`,
    paddingHorizontal: StewiePayBrand.spacing.md,
    paddingVertical: StewiePayBrand.spacing.sm,
  },
  successText: {
    marginLeft: StewiePayBrand.spacing.sm,
    color: StewiePayBrand.colors.success,
    flex: 1,
  },
  errorBox: {
    marginTop: StewiePayBrand.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${StewiePayBrand.colors.error}10`,
    borderRadius: StewiePayBrand.radius.md,
    borderWidth: 1,
    borderColor: `${StewiePayBrand.colors.error}40`,
    paddingHorizontal: StewiePayBrand.spacing.md,
    paddingVertical: StewiePayBrand.spacing.sm,
  },
  errorText: {
    marginLeft: StewiePayBrand.spacing.sm,
    color: StewiePayBrand.colors.error,
    flex: 1,
  },
  reviewSection: {
    marginTop: StewiePayBrand.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: StewiePayBrand.colors.surfaceVariant,
    paddingTop: StewiePayBrand.spacing.md,
  },
  reviewItem: {
    backgroundColor: StewiePayBrand.colors.surface,
    borderRadius: StewiePayBrand.radius.md,
    borderWidth: 1,
    borderColor: StewiePayBrand.colors.surfaceVariant,
    padding: StewiePayBrand.spacing.md,
    marginBottom: StewiePayBrand.spacing.sm,
  },
});
