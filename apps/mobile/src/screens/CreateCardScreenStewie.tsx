import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import { CardsAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieCard } from '../components/stewiepay/StewieCard';
import { StewieText } from '../components/stewiepay/StewieText';
import { StewieButton } from '../components/stewiepay/StewieButton';
import { GlassCard } from '../components/modern/GlassCard';
import { BackButton } from '../components/navigation/BackButton';
import { Ionicons } from '@expo/vector-icons';

const CARD_TYPES = [
  {
    value: 'PERMANENT',
    label: 'Permanent',
    icon: 'card-outline' as keyof typeof Ionicons.glyphMap,
    desc: 'Your everyday companion. Full control, always available.',
    color: StewiePayBrand.colors.primary,
    gradient: StewiePayBrand.colors.gradients.primary,
  },
  {
    value: 'BURNER',
    label: 'Burner',
    icon: 'flash-outline' as keyof typeof Ionicons.glyphMap,
    desc: 'One-time use. Perfect for trials and single purchases.',
    color: StewiePayBrand.colors.accent,
    gradient: StewiePayBrand.colors.gradients.accent,
  },
  {
    value: 'MERCHANT_LOCKED',
    label: 'Merchant Locked',
    icon: 'lock-closed-outline' as keyof typeof Ionicons.glyphMap,
    desc: 'Works only where you choose. Maximum security, zero surprises.',
    color: StewiePayBrand.colors.secondary,
    gradient: StewiePayBrand.colors.gradients.secondary,
  },
  {
    value: 'ADS_ONLY',
    label: 'Ads Only',
    icon: 'megaphone-outline' as keyof typeof Ionicons.glyphMap,
    desc: 'Dedicated to advertising spend. Track every campaign separately.',
    color: StewiePayBrand.colors.warning,
    gradient: [StewiePayBrand.colors.warning, StewiePayBrand.colors.warningDark],
  },
];

export const CreateCardScreenStewie = ({ navigation }: any) => {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState('PERMANENT');
  const [limits, setLimits] = useState({ daily: '', monthly: '', perTxn: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTypeConfig = CARD_TYPES.find((t) => t.value === selectedType);

  const assertKycVerified = () => {
    const kycStatus = (user as any)?.kycStatus || 'PENDING';
    if (kycStatus === 'VERIFIED') return true;
    const message =
      kycStatus === 'SUBMITTED'
        ? 'Your KYC is under review. Card creation unlocks after approval.'
        : kycStatus === 'REJECTED'
          ? `KYC rejected: ${(user as any)?.kycRejectionReason || 'Please resubmit to continue.'}`
          : 'Please complete KYC to create cards.';
    Alert.alert('KYC required', message, [
      { text: 'Not now', style: 'cancel' },
      { text: 'Open KYC', onPress: () => navigation.navigate('KycVerification') }
    ]);
    return false;
  };

  const handleCreate = async () => {
    if (!assertKycVerified()) {
      return;
    }
    setLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const payload: any = {
        type: selectedType,
      };
      if (limits.daily) payload.limitDaily = parseInt(limits.daily);
      if (limits.monthly) payload.limitMonthly = parseInt(limits.monthly);
      if (limits.perTxn) payload.limitPerTxn = parseInt(limits.perTxn);

      console.log('[CreateCard] Creating card with payload:', payload);
      const response = await CardsAPI.create(payload);
      console.log('[CreateCard] Card created successfully:', response.data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (e: any) {
      console.error('[CreateCard] Failed to create card:', e);
      const errorMessage = e?.response?.data?.message || e?.message || 'Failed to create card';
      setError(errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* StewiePay Header */}
      <LinearGradient
        colors={(selectedTypeConfig?.gradient || StewiePayBrand.colors.gradients.primary) as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <BackButton />
        <Animatable.View animation="fadeInDown" duration={600}>
          <StewieText variant="headlineLarge" color="primary" weight="black" style={styles.headerTitle}>
            Create New Card
          </StewieText>
          <StewieText variant="bodyLarge" color="primary" style={styles.headerSubtitle}>
            Choose your card type and set your limits
          </StewieText>
        </Animatable.View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Card Type Selection */}
        <Animatable.View animation="fadeInUp" delay={200} duration={600}>
          <GlassCard elevated intensity={35} style={styles.sectionCard}>
            <StewieText variant="titleLarge" color="primary" weight="bold" style={styles.sectionTitle}>
              Choose Your Card Type
            </StewieText>
            <StewieText variant="bodyMedium" color="muted" style={styles.sectionSubtitle}>
              Each card type is designed for a specific purpose
            </StewieText>
            <View style={styles.typeList}>
              {CARD_TYPES.map((type, index) => (
                <Animatable.View
                  key={type.value}
                  animation="fadeInUp"
                  delay={300 + index * 100}
                  duration={400}
                >
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedType(type.value);
                    }}
                    style={[
                      styles.typeCard,
                      {
                        backgroundColor:
                          selectedType === type.value ? StewiePayBrand.colors.surfaceElevated : StewiePayBrand.colors.surface,
                        borderColor: selectedType === type.value ? type.color : 'transparent',
                        borderWidth: selectedType === type.value ? 2 : 0,
                      },
                    ]}
                  >
                    <View style={styles.typeContent}>
                      <View style={[styles.iconContainer, { backgroundColor: `${type.color}20` }]}>
                        <Ionicons name={type.icon} size={32} color={type.color} />
                      </View>
                      <View style={styles.typeText}>
                        <StewieText variant="titleMedium" color="primary" weight="bold">
                          {type.label}
                        </StewieText>
                        <StewieText variant="bodySmall" color="muted" style={{ marginTop: StewiePayBrand.spacing.xs }}>
                          {type.desc}
                        </StewieText>
                      </View>
                      <View
                        style={[
                          styles.radioButton,
                          selectedType === type.value && { backgroundColor: type.color },
                        ]}
                      >
                        {selectedType === type.value && (
                          <View style={styles.radioButtonInner} />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animatable.View>
              ))}
            </View>
          </GlassCard>
        </Animatable.View>

        {/* Spending Limits */}
        <Animatable.View animation="fadeInUp" delay={400} duration={600}>
          <GlassCard elevated intensity={35} style={styles.sectionCard}>
            <StewieText variant="titleLarge" color="primary" weight="bold" style={styles.sectionTitle}>
              Set Spending Limits
            </StewieText>
            <View style={styles.infoChip}>
              <Ionicons name="information-circle-outline" size={16} color={StewiePayBrand.colors.textMuted} />
              <StewieText variant="bodySmall" color="muted" style={{ marginLeft: StewiePayBrand.spacing.xs }}>
                Optional • Control your spending with precision
              </StewieText>
            </View>
            <View style={styles.limitsList}>
              {/* Daily Limit */}
              <View style={styles.inputWrapper}>
                <StewieText variant="labelMedium" color="muted" style={styles.inputLabel}>
                  Daily Limit (ETB)
                </StewieText>
                <View style={styles.inputBox}>
                  <Ionicons name="calendar-outline" size={20} color={StewiePayBrand.colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    placeholder="e.g., 5000"
                    placeholderTextColor={StewiePayBrand.colors.textMuted}
                    value={limits.daily}
                    onChangeText={(text) => setLimits({ ...limits, daily: text })}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Monthly Limit */}
              <View style={styles.inputWrapper}>
                <StewieText variant="labelMedium" color="muted" style={styles.inputLabel}>
                  Monthly Limit (ETB)
                </StewieText>
                <View style={styles.inputBox}>
                  <Ionicons name="calendar" size={20} color={StewiePayBrand.colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    placeholder="e.g., 50000"
                    placeholderTextColor={StewiePayBrand.colors.textMuted}
                    value={limits.monthly}
                    onChangeText={(text) => setLimits({ ...limits, monthly: text })}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Per Transaction Limit */}
              <View style={styles.inputWrapper}>
                <StewieText variant="labelMedium" color="muted" style={styles.inputLabel}>
                  Per Transaction Limit (ETB)
                </StewieText>
                <View style={styles.inputBox}>
                  <Ionicons name="card-outline" size={20} color={StewiePayBrand.colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    placeholder="e.g., 1000"
                    placeholderTextColor={StewiePayBrand.colors.textMuted}
                    value={limits.perTxn}
                    onChangeText={(text) => setLimits({ ...limits, perTxn: text })}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
              </View>
            </View>
          </GlassCard>
        </Animatable.View>

        {/* Error Message */}
        {error && (
          <Animatable.View animation="shake" duration={500}>
            <GlassCard elevated intensity={35} style={styles.errorCard}>
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={StewiePayBrand.colors.error} />
                <StewieText variant="bodyMedium" color="error" style={styles.errorText}>
                  {error}
                </StewieText>
              </View>
            </GlassCard>
          </Animatable.View>
        )}

        {/* Create Button */}
        <StewieButton
          label={loading ? 'Creating...' : 'Create Card'}
          onPress={handleCreate}
          variant="primary"
          size="lg"
          loading={loading}
          disabled={loading}
          fullWidth
          style={styles.createButton}
          icon={<Ionicons name="card" size={20} color="#FFFFFF" />}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: StewiePayBrand.colors.backgroundSecondary, // Gray background
  },
  header: {
    paddingTop: 80,
    paddingBottom: StewiePayBrand.spacing['2xl'],
    paddingHorizontal: StewiePayBrand.spacing.md,
    borderBottomLeftRadius: StewiePayBrand.radius['3xl'],
    borderBottomRightRadius: StewiePayBrand.radius['3xl'],
  },
  headerTitle: {
    textAlign: 'center',
    marginBottom: StewiePayBrand.spacing.sm,
  },
  headerSubtitle: {
    textAlign: 'center',
    opacity: 0.9,
  },
  scrollContent: {
    padding: StewiePayBrand.spacing.md,
    paddingBottom: StewiePayBrand.spacing['3xl'],
  },
  sectionCard: {
    marginBottom: StewiePayBrand.spacing.lg,
    padding: StewiePayBrand.spacing.lg,
  },
  sectionTitle: {
    marginBottom: StewiePayBrand.spacing.xs,
  },
  sectionSubtitle: {
    marginBottom: StewiePayBrand.spacing.md,
  },
  typeList: {
    gap: StewiePayBrand.spacing.sm,
    marginTop: StewiePayBrand.spacing.md,
  },
  typeCard: {
    borderRadius: StewiePayBrand.radius.lg,
    padding: StewiePayBrand.spacing.md,
  },
  typeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: StewiePayBrand.spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: StewiePayBrand.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: {
    flex: 1,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: StewiePayBrand.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: StewiePayBrand.colors.background,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: StewiePayBrand.colors.surfaceElevated,
    padding: StewiePayBrand.spacing.sm,
    borderRadius: StewiePayBrand.radius.sm,
    marginBottom: StewiePayBrand.spacing.md,
  },
  limitsList: {
    gap: StewiePayBrand.spacing.md,
    marginTop: StewiePayBrand.spacing.md,
  },
  inputWrapper: {
    gap: StewiePayBrand.spacing.xs,
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
  errorCard: {
    marginBottom: StewiePayBrand.spacing.md,
    backgroundColor: `${StewiePayBrand.colors.error}20`,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: StewiePayBrand.spacing.sm,
  },
  errorText: {
    flex: 1,
  },
  createButton: {
    marginTop: StewiePayBrand.spacing.md,
    marginBottom: StewiePayBrand.spacing['2xl'],
  },
});

