import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, ActivityIndicator, TextInput, Linking, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { TopUpAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieCard } from '../components/stewiepay/StewieCard';
import { StewieText } from '../components/stewiepay/StewieText';
import { StewieButton } from '../components/stewiepay/StewieButton';
import { GlassCard } from '../components/modern/GlassCard';
import { SkeletonLoader, SkeletonCard } from '../components/modern/SkeletonLoader';
import { BackButton } from '../components/navigation/BackButton';
import { ModalTopUpWrapper } from '../components/navigation/ModalTopUpWrapper';
import { Ionicons } from '@expo/vector-icons';

const generateTopUpReference = () =>
  `topup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const TopUpScreenStewie = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [amount, setAmount] = useState('10000');
  const [reference, setReference] = useState(generateTopUpReference());
  const [topups, setTopups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedTopUpId, setExpandedTopUpId] = useState<string | null>(null);
  const [reconciliationByTopUp, setReconciliationByTopUp] = useState<Record<string, any>>({});
  const [reconLoadingTopUpId, setReconLoadingTopUpId] = useState<string | null>(null);

  const LIMITS = {
    perTxn: 50_000_000,
    daily: 5_000_000,
    monthly: 50_000_000,
  };

  const load = async () => {
    setLoading(true);
    try {
      const resp = await TopUpAPI.list();
      setTopups(resp.data || []);
    } catch (e) {
      console.error('Failed to load top-ups:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const initiate = async () => {
    const kycStatus = (user as any)?.kycStatus || 'PENDING';
    if (kycStatus !== 'VERIFIED') {
      const message =
        kycStatus === 'SUBMITTED'
          ? 'Your KYC is under review. Top-up will unlock after approval.'
          : kycStatus === 'REJECTED'
            ? `KYC rejected: ${(user as any)?.kycRejectionReason || 'Please resubmit to continue.'}`
            : 'Please complete KYC to top up your account.';
      Alert.alert('KYC required', message, [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open KYC', onPress: () => navigation.navigate('KycVerification') }
      ]);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      const effectiveReference = reference.trim() || generateTopUpReference();
      const resp = await TopUpAPI.initiate({ amount: Number(amount), currency: 'ETB', reference: effectiveReference });
      const checkoutUrl = resp?.data?.checkoutUrl;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (checkoutUrl) {
        setSuccessMessage('Top-up initiated. Complete payment in the opened page.');
        Linking.openURL(checkoutUrl);
      } else {
        setSuccessMessage('Top-up initiated. Tap a pending item to verify.');
      }
      setReference(generateTopUpReference());
      await load();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = (e as any)?.response?.data?.message || 'Failed to initiate top-up';
      setErrorMessage(String(msg));
      console.error('Failed to initiate top-up:', e);
    }
  };

  const verify = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await TopUpAPI.verify({ topUpId: id });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessMessage('Top-up verified successfully.');
      await load();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Failed to verify top-up:', e);
    }
  };

  const loadReconciliation = async (topUpId: string) => {
    setReconLoadingTopUpId(topUpId);
    try {
      const resp = await TopUpAPI.reconciliation(topUpId);
      setReconciliationByTopUp((prev) => ({
        ...prev,
        [topUpId]: resp.data
      }));
    } catch (error) {
      console.error('Failed to load top-up reconciliation:', error);
    } finally {
      setReconLoadingTopUpId(null);
    }
  };

  const toggleReconciliation = async (topUpId: string) => {
    const next = expandedTopUpId === topUpId ? null : topUpId;
    setExpandedTopUpId(next);
    if (next && !reconciliationByTopUp[topUpId]) {
      await loadReconciliation(topUpId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return StewiePayBrand.colors.success;
      case 'PENDING':
        return StewiePayBrand.colors.warning;
      case 'FAILED':
        return StewiePayBrand.colors.error;
      default:
        return StewiePayBrand.colors.textMuted;
    }
  };

  const getFundingStateColor = (state?: string) => {
    switch (state) {
      case 'CARD_LOADED':
        return StewiePayBrand.colors.success;
      case 'FAILED':
        return StewiePayBrand.colors.error;
      case 'ISSUER_PENDING':
      case 'PSP_CONFIRMED':
      case 'PSP_PENDING':
        return StewiePayBrand.colors.warning;
      default:
        return StewiePayBrand.colors.textMuted;
    }
  };

  const getFundingStateLabel = (state?: string) => {
    switch (state) {
      case 'PSP_PENDING':
        return 'PSP pending';
      case 'PSP_CONFIRMED':
        return 'PSP confirmed';
      case 'ISSUER_PENDING':
        return 'Issuer processing';
      case 'CARD_LOADED':
        return 'Card loaded';
      case 'FAILED':
        return 'Settlement failed';
      default:
        return state || 'Unknown';
    }
  };

  const buildFundingProgress = (topUp: any) => {
    const chain = ['PSP_PENDING', 'PSP_CONFIRMED', 'ISSUER_PENDING', 'CARD_LOADED'];
    const reconciliation = reconciliationByTopUp[topUp.id];
    const currentState = (reconciliation?.topUp?.fundingState || topUp.fundingState) as string | undefined;
    const reached = new Set<string>((reconciliation?.events || []).map((event: any) => event.toState));
    if (currentState) reached.add(currentState);
    const currentIndex = chain.indexOf(currentState || '');
    const isFailed = currentState === 'FAILED' || reached.has('FAILED');

    return {
      isFailed,
      steps: chain.map((state, index) => ({
        state,
        label: getFundingStateLabel(state),
        active: currentState === state,
        done: reached.has(state) || (currentIndex >= 0 && index < currentIndex)
      }))
    };
  };

  const totalTopUps = topups.reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <ModalTopUpWrapper>
      <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={StewiePayBrand.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* StewiePay Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <StewieText variant="headlineLarge" color="primary" weight="black">
            Top Up
          </StewieText>
          <StewieText variant="bodyMedium" color="muted" style={{ marginTop: StewiePayBrand.spacing.xs }}>
            {topups.length} {topups.length === 1 ? 'top-up' : 'top-ups'} • Total: ETB {totalTopUps.toLocaleString()}
          </StewieText>
        </Animated.View>

        {/* Top-Up Form */}
        <View style={styles.formContainer}>
          <Animated.View entering={FadeInDown.delay(50).duration(400)}>
            <GlassCard elevated intensity={35} style={styles.formCard}>
              <StewieText variant="titleLarge" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.md }}>
                Initiate Top-Up
              </StewieText>

              <View style={styles.inputWrapper}>
                <StewieText variant="labelMedium" color="muted" style={styles.inputLabel}>
                  Amount (ETB)
                </StewieText>
                <View style={styles.inputBox}>
                  <Ionicons name="cash-outline" size={20} color={StewiePayBrand.colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter amount"
                    placeholderTextColor={StewiePayBrand.colors.textMuted}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
                <StewieText variant="labelSmall" color="muted" style={styles.helperText}>
                  Per top-up limit: ETB {LIMITS.perTxn.toLocaleString()} · Daily: ETB {LIMITS.daily.toLocaleString()} · Monthly: ETB {LIMITS.monthly.toLocaleString()}
                </StewieText>
              </View>

              <View style={styles.inputWrapper}>
                <StewieText variant="labelMedium" color="muted" style={styles.inputLabel}>
                  Reference
                </StewieText>
                <View style={styles.inputBox}>
                  <Ionicons name="document-text-outline" size={20} color={StewiePayBrand.colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter reference"
                    placeholderTextColor={StewiePayBrand.colors.textMuted}
                    value={reference}
                    onChangeText={setReference}
                    style={styles.input}
                  />
                </View>
              </View>

              <StewieButton
                label="Initiate Top-Up"
                onPress={initiate}
                variant="primary"
                size="lg"
                fullWidth
                style={styles.submitButton}
                icon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
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
            </GlassCard>
          </Animated.View>
        </View>

        {/* History */}
        <View style={styles.historyContainer}>
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <StewieText variant="titleLarge" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.md, paddingHorizontal: StewiePayBrand.spacing.md }}>
              History
            </StewieText>
          </Animated.View>

          {loading && topups.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size={32} color={StewiePayBrand.colors.primary} />
              <StewieText variant="bodyMedium" color="muted" style={{ marginTop: StewiePayBrand.spacing.md }}>
                Loading top-ups...
              </StewieText>
            </View>
          ) : topups.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.emptyContainer}>
              <Ionicons name="add-circle-outline" size={64} color={StewiePayBrand.colors.textMuted} style={{ marginBottom: StewiePayBrand.spacing.lg }} />
              <StewieText variant="titleLarge" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.sm }}>
                No Top-Ups Yet
              </StewieText>
              <StewieText variant="bodyMedium" color="muted" style={{ textAlign: 'center', paddingHorizontal: StewiePayBrand.spacing.lg }}>
                Initiate your first top-up to add funds to your cards
              </StewieText>
            </Animated.View>
          ) : (
            <View style={styles.listContainer}>
              {topups.map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.delay(200 + index * 30).duration(400)}
                >
                  <TouchableOpacity
                    onPress={() => toggleReconciliation(item.id)}
                    activeOpacity={0.8}
                  >
                    <GlassCard elevated intensity={35} style={styles.topUpCard}>
                      <View style={styles.topUpContent}>
                        <View style={styles.topUpLeft}>
                          <StewieText variant="titleLarge" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.xs }}>
                            {item.currency} {item.amount.toLocaleString()}
                          </StewieText>
                          <StewieText variant="bodySmall" color="muted">
                            {item.reference}
                          </StewieText>
                          <StewieText variant="bodySmall" color="muted" style={{ marginTop: StewiePayBrand.spacing.xs }}>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </StewieText>
                        </View>
                        <View style={styles.topUpRight}>
                          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
                            <View
                              style={[
                                styles.statusDot,
                                { backgroundColor: getStatusColor(item.status) },
                              ]}
                            />
                            <StewieText
                              variant="labelSmall"
                              style={{ color: getStatusColor(item.status), marginLeft: StewiePayBrand.spacing.xs }}
                              weight="semibold"
                            >
                              {item.status}
                            </StewieText>
                          </View>
                          <View style={[styles.statusBadge, { marginTop: 6, backgroundColor: `${getFundingStateColor(item.fundingState)}20` }]}>
                            <View
                              style={[
                                styles.statusDot,
                                { backgroundColor: getFundingStateColor(item.fundingState) },
                              ]}
                            />
                            <StewieText
                              variant="labelSmall"
                              style={{ color: getFundingStateColor(item.fundingState), marginLeft: StewiePayBrand.spacing.xs }}
                              weight="semibold"
                            >
                              {getFundingStateLabel(item.fundingState)}
                            </StewieText>
                          </View>
                        </View>
                      </View>
                      {expandedTopUpId === item.id && (
                        <View style={styles.reconciliationSection}>
                          {reconLoadingTopUpId === item.id ? (
                            <View style={styles.reconciliationLoadingRow}>
                              <ActivityIndicator size={18} color={StewiePayBrand.colors.primary} />
                              <StewieText variant="bodySmall" color="muted" style={{ marginLeft: 8 }}>
                                Loading settlement timeline...
                              </StewieText>
                            </View>
                          ) : (
                            <>
                              {(() => {
                                const progress = buildFundingProgress(item);
                                return (
                                  <View style={styles.progressContainer}>
                                    <StewieText variant="labelMedium" color="muted" style={{ marginBottom: 8 }}>
                                      Settlement Status
                                    </StewieText>
                                    <View style={styles.progressRow}>
                                      {progress.steps.map((step, idx) => (
                                        <React.Fragment key={step.state}>
                                          <View style={styles.progressStepItem}>
                                            <View
                                              style={[
                                                styles.progressDot,
                                                step.active && styles.progressDotActive,
                                                (step.done || step.active) && { backgroundColor: getFundingStateColor(step.state) }
                                              ]}
                                            />
                                            <StewieText
                                              variant="labelSmall"
                                              color="muted"
                                              style={[
                                                styles.progressLabel,
                                                step.active && { color: getFundingStateColor(step.state) }
                                              ]}
                                            >
                                              {step.label}
                                            </StewieText>
                                          </View>
                                          {idx < progress.steps.length - 1 && (
                                            <View
                                              style={[
                                                styles.progressConnector,
                                                (step.done || step.active) && { backgroundColor: getFundingStateColor(step.state) }
                                              ]}
                                            />
                                          )}
                                        </React.Fragment>
                                      ))}
                                    </View>
                                    {progress.isFailed && (
                                      <StewieText variant="labelSmall" style={{ color: StewiePayBrand.colors.error, marginTop: 8 }}>
                                        Settlement failed. Review timeline details below.
                                      </StewieText>
                                    )}
                                  </View>
                                );
                              })()}
                              <StewieText variant="labelMedium" color="muted" style={{ marginBottom: 8 }}>
                                Settlement Timeline
                              </StewieText>
                              {(reconciliationByTopUp[item.id]?.events || []).length === 0 ? (
                                <StewieText variant="bodySmall" color="muted">
                                  No settlement events yet.
                                </StewieText>
                              ) : (
                                (reconciliationByTopUp[item.id]?.events || []).map((event: any) => (
                                  <View key={event.id} style={styles.reconciliationEventRow}>
                                    <View style={[styles.reconciliationDot, { backgroundColor: getFundingStateColor(event.toState) }]} />
                                    <View style={{ flex: 1 }}>
                                      <StewieText variant="bodySmall" color="primary" weight="semibold">
                                        {getFundingStateLabel(event.toState)} • {event.source}
                                      </StewieText>
                                      <StewieText variant="labelSmall" color="muted" style={{ marginTop: 2 }}>
                                        {new Date(event.createdAt).toLocaleString()}
                                      </StewieText>
                                      {event.message ? (
                                        <StewieText variant="labelSmall" color="muted" style={{ marginTop: 2 }}>
                                          {event.message}
                                        </StewieText>
                                      ) : null}
                                    </View>
                                  </View>
                                ))
                              )}
                              {item.status === 'PENDING' && (
                                <TouchableOpacity
                                  onPress={() => verify(item.id)}
                                  style={styles.verifyButton}
                                  activeOpacity={0.85}
                                >
                                  <StewieText variant="labelMedium" color="brand" weight="semibold">
                                    Verify now
                                  </StewieText>
                                </TouchableOpacity>
                              )}
                            </>
                          )}
                        </View>
                      )}
                    </GlassCard>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <BackButton />
    </View>
    </ModalTopUpWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: StewiePayBrand.colors.backgroundSecondary,
  },
  header: {
    paddingTop: 110, // Even more space below back button
    paddingBottom: StewiePayBrand.spacing.md,
    paddingHorizontal: StewiePayBrand.spacing.md,
  },
  formContainer: {
    paddingHorizontal: StewiePayBrand.spacing.md,
    marginBottom: StewiePayBrand.spacing.md,
  },
  formCard: {
    padding: StewiePayBrand.spacing.lg,
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
  submitButton: {
    marginTop: StewiePayBrand.spacing.md,
  },
  helperText: {
    marginTop: StewiePayBrand.spacing.xs,
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
  historyContainer: {
    paddingBottom: StewiePayBrand.spacing['3xl'],
  },
  loadingContainer: {
    padding: StewiePayBrand.spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: StewiePayBrand.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  listContainer: {
    paddingHorizontal: StewiePayBrand.spacing.md,
    paddingBottom: StewiePayBrand.spacing.lg,
  },
  topUpCard: {
    marginBottom: StewiePayBrand.spacing.md,
  },
  topUpContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: StewiePayBrand.spacing.md,
  },
  topUpLeft: {
    flex: 1,
  },
  topUpRight: {
    alignItems: 'flex-end'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: StewiePayBrand.spacing.sm,
    paddingVertical: StewiePayBrand.spacing.xs,
    borderRadius: StewiePayBrand.radius.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  reconciliationSection: {
    marginTop: StewiePayBrand.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: StewiePayBrand.colors.surfaceVariant,
    paddingTop: StewiePayBrand.spacing.sm
  },
  progressContainer: {
    marginBottom: StewiePayBrand.spacing.md
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  progressStepItem: {
    alignItems: 'center',
    width: 70
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: StewiePayBrand.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: StewiePayBrand.colors.surfaceVariant
  },
  progressDotActive: {
    transform: [{ scale: 1.1 }]
  },
  progressLabel: {
    marginTop: 4,
    textAlign: 'center'
  },
  progressConnector: {
    flex: 1,
    height: 2,
    backgroundColor: StewiePayBrand.colors.surfaceVariant,
    marginTop: 5,
    marginHorizontal: 6
  },
  reconciliationLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  reconciliationEventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  reconciliationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 8
  },
  verifyButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: StewiePayBrand.spacing.sm,
    paddingVertical: 6,
    borderRadius: StewiePayBrand.radius.md,
    borderWidth: 1,
    borderColor: `${StewiePayBrand.colors.primary}66`
  },
});

