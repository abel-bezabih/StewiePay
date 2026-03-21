import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, FlatList, TouchableOpacity, Text, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BrandButton } from '../components/BrandButton';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { TopUpAPI } from '../api/client';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import * as Animatable from 'react-native-animatable';

export const TopUpScreenPremium = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [amount, setAmount] = useState('10000');
  const [reference, setReference] = useState('demo-topup');
  const [topups, setTopups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTopUpId, setExpandedTopUpId] = useState<string | null>(null);
  const [reconciliationByTopUp, setReconciliationByTopUp] = useState<Record<string, any>>({});
  const [reconLoadingTopUpId, setReconLoadingTopUpId] = useState<string | null>(null);

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
      await TopUpAPI.initiate({ amount: Number(amount), currency: 'ETB', reference });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Failed to initiate top-up:', e);
    }
  };

  const verify = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await TopUpAPI.verify({ topUpId: id });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      setReconciliationByTopUp((prev) => ({ ...prev, [topUpId]: resp.data }));
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

  const totalTopUps = topups.reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: StewiePayBrand.colors.background }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Top Up
          </Text>
        </View>

        {/* Top-Up Form */}
        <View style={styles.formContainer}>
          <Animatable.View animation="fadeInUp" delay={100} duration={400}>
            <View style={styles.formCard}>
              <Text style={{ color: StewiePayBrand.colors.textPrimary, marginBottom: StewiePayBrand.spacing.md, fontWeight: '700', fontSize: 18 }}>
                Initiate Top-Up
              </Text>
              
              <TextInput
                placeholder="Amount (ETB)"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                style={[styles.input, { color: StewiePayBrand.colors.textPrimary, backgroundColor: StewiePayBrand.colors.surface, borderColor: StewiePayBrand.colors.surfaceVariant, borderWidth: 1, borderRadius: 8, padding: 12 }]}
                placeholderTextColor={StewiePayBrand.colors.textMuted}
              />
              
              <TextInput
                placeholder="Reference"
                value={reference}
                onChangeText={setReference}
                style={[styles.input, { color: StewiePayBrand.colors.textPrimary, backgroundColor: StewiePayBrand.colors.surface, borderColor: StewiePayBrand.colors.surfaceVariant, borderWidth: 1, borderRadius: 8, padding: 12 }]}
                placeholderTextColor={StewiePayBrand.colors.textMuted}
              />
              
              <BrandButton
                label="Initiate Top-Up"
                onPress={initiate}
                
                size="lg"
                fullWidth
                icon="💰"
              />
            </View>
          </Animatable.View>
        </View>

        {/* History */}
        <View style={styles.historyContainer}>
          <Text style={{ color: StewiePayBrand.colors.textPrimary, marginBottom: StewiePayBrand.spacing.md, fontWeight: '700', fontSize: 20, paddingHorizontal: StewiePayBrand.spacing.lg }}>
            History
          </Text>
          
          {loading && topups.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size={32} color={StewiePayBrand.colors.primary} />
              <Text style={{ color: StewiePayBrand.colors.textMuted, marginTop: StewiePayBrand.spacing.md }}>
                Loading top-ups...
              </Text>
            </View>
          ) : topups.length === 0 ? (
            <View style={styles.emptyContainer}>
              <EmptyState
                icon="💳"
                title="No top-ups yet"
                subtitle="Initiate your first top-up to add funds to your cards"
              />
            </View>
          ) : (
            <View style={styles.listContainer}>
              {topups.map((item, index) => (
                <Animatable.View
                  key={item.id}
                  animation="fadeInUp"
                  delay={200 + index * 50}
                  duration={400}
                >
                  <TouchableOpacity
                    onPress={() => toggleReconciliation(item.id)}
                    style={styles.topUpCard}
                  >
                    <View style={styles.topUpContent}>
                      <View style={styles.topUpLeft}>
                        <Text style={{ fontWeight: '700', color: StewiePayBrand.colors.textPrimary, marginBottom: 4, fontSize: 16 }}>
                          {item.currency} {item.amount.toLocaleString()}
                        </Text>
                        <Text style={{ color: StewiePayBrand.colors.textMuted, fontSize: 12 }}>
                          {item.reference}
                        </Text>
                        <Text style={{ color: StewiePayBrand.colors.textMuted, marginTop: 4, fontSize: 12 }}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.topUpRight}>
                        <View
                          style={{
                            backgroundColor: `${getStatusColor(item.status)}20`,
                            borderWidth: 1,
                            borderColor: getStatusColor(item.status),
                            borderRadius: 12,
                            paddingHorizontal: 8,
                            paddingVertical: 4
                          }}
                        >
                          <Text style={{
                            color: getStatusColor(item.status),
                            fontSize: 12,
                            fontWeight: '600'
                          }}>
                            {item.status}
                          </Text>
                        </View>
                        <View
                          style={{
                            marginTop: 6,
                            backgroundColor: `${getFundingStateColor(item.fundingState)}20`,
                            borderWidth: 1,
                            borderColor: getFundingStateColor(item.fundingState),
                            borderRadius: 12,
                            paddingHorizontal: 8,
                            paddingVertical: 4
                          }}
                        >
                          <Text style={{
                            color: getFundingStateColor(item.fundingState),
                            fontSize: 12,
                            fontWeight: '600'
                          }}>
                            {getFundingStateLabel(item.fundingState)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {expandedTopUpId === item.id && (
                      <View style={styles.reconciliationSection}>
                        {reconLoadingTopUpId === item.id ? (
                          <Text style={{ color: StewiePayBrand.colors.textMuted }}>Loading settlement timeline...</Text>
                        ) : (
                          <>
                            {(reconciliationByTopUp[item.id]?.events || []).length === 0 ? (
                              <Text style={{ color: StewiePayBrand.colors.textMuted }}>No settlement events yet.</Text>
                            ) : (
                              (reconciliationByTopUp[item.id]?.events || []).map((event: any) => (
                                <View key={event.id} style={styles.reconciliationRow}>
                                  <Text style={{ color: StewiePayBrand.colors.textPrimary, fontWeight: '700', fontSize: 12 }}>
                                    {getFundingStateLabel(event.toState)} • {event.source}
                                  </Text>
                                  <Text style={{ color: StewiePayBrand.colors.textMuted, fontSize: 11 }}>
                                    {new Date(event.createdAt).toLocaleString()}
                                  </Text>
                                  {event.message ? (
                                    <Text style={{ color: StewiePayBrand.colors.textMuted, fontSize: 11, marginTop: 2 }}>
                                      {event.message}
                                    </Text>
                                  ) : null}
                                </View>
                              ))
                            )}
                            {item.status === 'PENDING' && (
                              <TouchableOpacity onPress={() => verify(item.id)} style={styles.verifyButton}>
                                <Text style={{ color: '#0B1224', fontWeight: '700', fontSize: 12 }}>Verify now</Text>
                              </TouchableOpacity>
                            )}
                          </>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                </Animatable.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#0A0A0A' // Darker than cards but not pure black
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 32
  },
  formContainer: {
    padding: StewiePayBrand.spacing.lg
  },
  formCard: {
    padding: StewiePayBrand.spacing.lg,
    backgroundColor: '#1A1A1A',
    borderRadius: 12
  },
  input: {
    marginBottom: StewiePayBrand.spacing.md,
    backgroundColor: 'transparent'
  },
  historyContainer: {
    paddingBottom: StewiePayBrand.spacing['3xl']
  },
  loadingContainer: {
    padding: StewiePayBrand.spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyContainer: {
    padding: StewiePayBrand.spacing.lg
  },
  listContainer: {
    paddingHorizontal: StewiePayBrand.spacing.lg,
    paddingBottom: StewiePayBrand.spacing.lg
  },
  topUpCard: {
    marginBottom: StewiePayBrand.spacing.md,
    backgroundColor: '#1A1A1A',
    borderRadius: 12
  },
  topUpContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: StewiePayBrand.spacing.md
  },
  topUpLeft: {
    flex: 1
  },
  topUpRight: {
    alignItems: 'flex-end'
  },
  reconciliationSection: {
    marginTop: StewiePayBrand.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: StewiePayBrand.colors.surfaceVariant,
    paddingTop: StewiePayBrand.spacing.sm
  },
  reconciliationRow: {
    marginBottom: 8
  },
  verifyButton: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: StewiePayBrand.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  }
});



