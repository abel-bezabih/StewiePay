import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Switch, TextInput, Alert } from 'react-native';
import { CardsAPI, SubscriptionsAPI, TransactionsAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieCard } from '../components/stewiepay/StewieCard';
import { StewieText } from '../components/stewiepay/StewieText';
import { StewiePaymentCard } from '../components/stewiepay/StewiePaymentCard';
import { GlassCard } from '../components/modern/GlassCard';
import { MerchantLockManager } from '../components/MerchantLockManager';
import { TimeWindowManager } from '../components/TimeWindowManager';
import { BackButton } from '../components/navigation/BackButton';
import { Ionicons } from '@expo/vector-icons';

export const CardDetailScreen = ({ route, navigation }: any) => {
  const { cardId } = route.params;
  const { user } = useAuth();
  const [card, setCard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [stats, setStats] = useState({ today: 0, thisMonth: 0, transactions: 0 });
  const [recentTxns, setRecentTxns] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [editingSubscriptionId, setEditingSubscriptionId] = useState<string | null>(null);
  const [subMerchant, setSubMerchant] = useState('');
  const [subAmountHint, setSubAmountHint] = useState('');
  const [subCurrency, setSubCurrency] = useState('ETB');
  const [subNextCharge, setSubNextCharge] = useState('');
  const [savingSubscription, setSavingSubscription] = useState(false);

  const resetSubscriptionForm = () => {
    setEditingSubscriptionId(null);
    setSubMerchant('');
    setSubAmountHint('');
    setSubCurrency('ETB');
    setSubNextCharge('');
    setShowSubscriptionForm(false);
  };

  const loadSubscriptions = async () => {
    setSubscriptionLoading(true);
    try {
      const resp = await SubscriptionsAPI.list({ cardId });
      setSubscriptions(resp.data || []);
    } catch (e) {
      console.error('Failed to load subscriptions:', e);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const startCreateSubscription = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingSubscriptionId(null);
    setSubMerchant('');
    setSubAmountHint('');
    setSubCurrency(card?.currency || 'ETB');
    setSubNextCharge('');
    setShowSubscriptionForm(true);
  };

  const startEditSubscription = (sub: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingSubscriptionId(sub.id);
    setSubMerchant(sub.merchant || '');
    setSubAmountHint(sub.amountHint != null ? String(sub.amountHint) : '');
    setSubCurrency(sub.currency || card?.currency || 'ETB');
    setSubNextCharge(sub.nextExpectedCharge ? String(sub.nextExpectedCharge).slice(0, 10) : '');
    setShowSubscriptionForm(true);
  };

  const saveSubscription = async () => {
    const merchant = subMerchant.trim();
    if (!merchant) {
      Alert.alert('Missing merchant', 'Please enter a merchant name.');
      return;
    }
    const amountHint = subAmountHint.trim() ? Number(subAmountHint.trim()) : undefined;
    if (amountHint !== undefined && (!Number.isFinite(amountHint) || amountHint < 0)) {
      Alert.alert('Invalid amount', 'Amount hint must be a positive number.');
      return;
    }
    const nextExpectedCharge = subNextCharge.trim() ? `${subNextCharge.trim()}T00:00:00.000Z` : undefined;

    setSavingSubscription(true);
    try {
      if (editingSubscriptionId) {
        await SubscriptionsAPI.update(editingSubscriptionId, {
          merchant,
          amountHint: amountHint ?? null,
          currency: subCurrency.trim() || 'ETB',
          nextExpectedCharge: nextExpectedCharge ?? null
        });
      } else {
        await SubscriptionsAPI.create({
          cardId,
          merchant,
          amountHint,
          currency: subCurrency.trim() || 'ETB',
          nextExpectedCharge
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadSubscriptions();
      resetSubscriptionForm();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Failed to save subscription:', e);
      Alert.alert('Save failed', 'Could not save subscription right now.');
    } finally {
      setSavingSubscription(false);
    }
  };

  const deleteSubscription = async (subscriptionId: string) => {
    Alert.alert('Delete subscription', 'Are you sure you want to remove this subscription?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await SubscriptionsAPI.remove(subscriptionId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await loadSubscriptions();
          } catch (e) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            console.error('Failed to delete subscription:', e);
            Alert.alert('Delete failed', 'Could not delete subscription right now.');
          }
        }
      }
    ]);
  };

  const load = async () => {
    try {
      const [cardsResp, txnsResp] = await Promise.all([
        CardsAPI.list(),
        TransactionsAPI.list(cardId).catch(() => ({ data: [] })),
      ]);
      const found = cardsResp.data.find((c: any) => c.id === cardId);
      setCard(found);

      const txns = txnsResp.data || [];
      const now = new Date();
      const today = txns.filter(
        (t: any) => new Date(t.createdAt || t.timestamp).toDateString() === now.toDateString(),
      );
      const thisMonth = txns.filter(
        (t: any) => new Date(t.createdAt || t.timestamp).getMonth() === now.getMonth(),
      );

      setStats({
        today: today.reduce((sum: number, t: any) => sum + t.amount, 0),
        thisMonth: thisMonth.reduce((sum: number, t: any) => sum + t.amount, 0),
        transactions: txns.length,
      });

      const sorted = [...txns].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.timestamp || 0).getTime();
        const dateB = new Date(b.createdAt || b.timestamp || 0).getTime();
        return dateB - dateA;
      });
      setRecentTxns(sorted.slice(0, 3));
      await loadSubscriptions();
    } catch (e) {
      console.error('Failed to load card:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [cardId]);

  const toggleStatus = async () => {
    setToggling(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (card.status === 'FROZEN') {
        await CardsAPI.unfreeze(card.id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await CardsAPI.freeze(card.id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await load();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setToggling(false);
    }
  };

  if (loading || !card) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size={32} color={StewiePayBrand.colors.primary} />
        <StewieText variant="bodyMedium" color="muted" style={{ marginTop: StewiePayBrand.spacing.md }}>
          Loading card...
        </StewieText>
      </View>
    );
  }

  const statusColor =
    card.status === 'FROZEN'
      ? StewiePayBrand.colors.error
      : card.status === 'CLOSED'
        ? StewiePayBrand.colors.textMuted
        : StewiePayBrand.colors.success;
  const statusLabel =
    card.status === 'FROZEN'
      ? 'Frozen'
      : card.status === 'CLOSED'
        ? 'Closed'
        : 'Active';

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <BackButton />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* StewiePay Payment Card Display */}
        <View style={styles.cardContainer}>
          <StewiePaymentCard
            cardNumber={card.issuerCardId || '4242 4242 4242 4242'}
            cardholderName={user?.name || 'Cardholder'}
            type={card.type || 'PERMANENT'}
            status={card.status}
          />
        </View>

        {/* Card Summary */}
        <GlassCard elevated intensity={35} style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <StewieText variant="labelSmall" color="muted">Type</StewieText>
              <StewieText variant="titleMedium" color="primary" weight="semibold">
                {String(card.type || 'PERMANENT').replace('_', ' ')}
              </StewieText>
            </View>
            <View style={[styles.statusPill, { backgroundColor: `${statusColor}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <StewieText variant="labelSmall" style={{ color: statusColor, marginLeft: StewiePayBrand.spacing.xs }} weight="semibold">
                {statusLabel}
              </StewieText>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View>
              <StewieText variant="labelSmall" color="muted">Currency</StewieText>
              <StewieText variant="titleMedium" color="primary" weight="semibold">
                {card.currency || 'ETB'}
              </StewieText>
            </View>
            <View>
              <StewieText variant="labelSmall" color="muted">Limits</StewieText>
              <StewieText variant="bodyMedium" color="muted">
                {card.limitDaily ? `Daily ${card.limitDaily.toLocaleString()}` : 'No daily limit'}
              </StewieText>
            </View>
          </View>
          {card.type === 'BURNER' && (
            <View style={styles.noticeRow}>
              <Ionicons name="flash-outline" size={16} color={StewiePayBrand.colors.warning} />
              <StewieText variant="bodySmall" style={styles.noticeText}>
                Burner cards auto‑close after the first settled transaction.
              </StewieText>
            </View>
          )}
        </GlassCard>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <GlassCard elevated intensity={35} style={styles.statCard}>
            <StewieText variant="labelMedium" color="muted" style={{ marginBottom: StewiePayBrand.spacing.xs }}>
              Today
            </StewieText>
            <StewieText variant="headlineMedium" color="primary" weight="black">
              ETB {stats.today.toLocaleString()}
            </StewieText>
          </GlassCard>
          <GlassCard elevated intensity={35} style={styles.statCard}>
            <StewieText variant="labelMedium" color="muted" style={{ marginBottom: StewiePayBrand.spacing.xs }}>
              This Month
            </StewieText>
            <StewieText variant="headlineMedium" color="primary" weight="black">
              ETB {stats.thisMonth.toLocaleString()}
            </StewieText>
          </GlassCard>
          <GlassCard elevated intensity={35} style={styles.statCard}>
            <StewieText variant="labelMedium" color="muted" style={{ marginBottom: StewiePayBrand.spacing.xs }}>
              Transactions
            </StewieText>
            <StewieText variant="headlineMedium" color="primary" weight="black">
              {stats.transactions}
            </StewieText>
          </GlassCard>
        </View>

        {/* Card Controls */}
        <GlassCard elevated intensity={35} style={styles.section}>
          <StewieText variant="titleLarge" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.md }}>
            Card Controls
          </StewieText>

          {/* Freeze Toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabel}>
              <StewieText variant="titleMedium" color="primary" weight="semibold" style={{ marginBottom: StewiePayBrand.spacing.xs }}>
                {card.status === 'FROZEN'
                  ? 'Card is frozen'
                  : card.status === 'CLOSED'
                    ? 'Card is closed'
                    : 'Card is active'}
              </StewieText>
              <StewieText variant="bodySmall" color="muted">
                {card.status === 'FROZEN'
                  ? 'This card cannot be used until it is unfrozen.'
                  : card.status === 'CLOSED'
                    ? 'This card is permanently closed.'
                    : 'Freeze this card to instantly stop all transactions.'}
              </StewieText>
            </View>
            <Switch
              value={card.status === 'FROZEN'}
              onValueChange={toggleStatus}
              disabled={toggling || card.status === 'CLOSED'}
              trackColor={{
                false: StewiePayBrand.colors.surfaceVariant,
                true: StewiePayBrand.colors.error,
              }}
              thumbColor={card.status === 'FROZEN' ? StewiePayBrand.colors.textPrimary : StewiePayBrand.colors.textMuted}
            />
          </View>

          <View style={styles.divider} />

          {/* Limits Display */}
          <View style={styles.limitsContainer}>
            <LimitRow label="Daily Limit" value={card.limitDaily} currency="ETB" />
            <LimitRow label="Monthly Limit" value={card.limitMonthly} currency="ETB" />
            <LimitRow label="Per Transaction" value={card.limitPerTxn} currency="ETB" />
          </View>
        </GlassCard>

        {/* Subscriptions */}
        <GlassCard elevated intensity={35} style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <StewieText variant="titleLarge" color="primary" weight="bold">
              Subscriptions
            </StewieText>
            <TouchableOpacity onPress={startCreateSubscription} style={styles.linkButton}>
              <Ionicons name="add-circle-outline" size={18} color={StewiePayBrand.colors.primary} />
              <StewieText variant="labelMedium" color="primary" weight="semibold">
                Add
              </StewieText>
            </TouchableOpacity>
          </View>

          {showSubscriptionForm && (
            <View style={styles.subscriptionForm}>
              <StewieText variant="labelSmall" color="muted" style={styles.subscriptionLabel}>
                Merchant
              </StewieText>
              <TextInput
                value={subMerchant}
                onChangeText={setSubMerchant}
                placeholder="e.g. Netflix"
                placeholderTextColor={StewiePayBrand.colors.textMuted}
                style={styles.subscriptionInput}
              />

              <View style={styles.subscriptionFormRow}>
                <View style={{ flex: 1 }}>
                  <StewieText variant="labelSmall" color="muted" style={styles.subscriptionLabel}>
                    Amount Hint
                  </StewieText>
                  <TextInput
                    value={subAmountHint}
                    onChangeText={setSubAmountHint}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor={StewiePayBrand.colors.textMuted}
                    style={styles.subscriptionInput}
                  />
                </View>
                <View style={{ width: 90 }}>
                  <StewieText variant="labelSmall" color="muted" style={styles.subscriptionLabel}>
                    Currency
                  </StewieText>
                  <TextInput
                    value={subCurrency}
                    onChangeText={setSubCurrency}
                    autoCapitalize="characters"
                    placeholder="ETB"
                    placeholderTextColor={StewiePayBrand.colors.textMuted}
                    style={styles.subscriptionInput}
                  />
                </View>
              </View>

              <StewieText variant="labelSmall" color="muted" style={styles.subscriptionLabel}>
                Next Charge Date (YYYY-MM-DD)
              </StewieText>
              <TextInput
                value={subNextCharge}
                onChangeText={setSubNextCharge}
                placeholder="2026-04-01"
                placeholderTextColor={StewiePayBrand.colors.textMuted}
                style={styles.subscriptionInput}
              />

              <View style={styles.subscriptionActionsRow}>
                <TouchableOpacity onPress={resetSubscriptionForm} style={styles.subscriptionGhostButton}>
                  <StewieText variant="labelMedium" color="muted">Cancel</StewieText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveSubscription}
                  style={styles.subscriptionPrimaryButton}
                  disabled={savingSubscription}
                >
                  {savingSubscription ? (
                    <ActivityIndicator size={16} color="#FFFFFF" />
                  ) : (
                    <StewieText variant="labelMedium" color="onPrimary" weight="semibold">
                      {editingSubscriptionId ? 'Save' : 'Create'}
                    </StewieText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {subscriptionLoading ? (
            <View style={styles.subscriptionEmpty}>
              <ActivityIndicator size={20} color={StewiePayBrand.colors.primary} />
              <StewieText variant="bodySmall" color="muted" style={{ marginTop: 6 }}>
                Loading subscriptions...
              </StewieText>
            </View>
          ) : subscriptions.length === 0 ? (
            <StewieText variant="bodyMedium" color="muted">
              No subscriptions linked to this card yet.
            </StewieText>
          ) : (
            <View style={styles.subscriptionList}>
              {subscriptions.map((sub: any) => (
                <View key={sub.id} style={styles.subscriptionRow}>
                  <View style={{ flex: 1 }}>
                    <StewieText variant="titleSmall" color="primary" weight="semibold">
                      {sub.merchant}
                    </StewieText>
                    <StewieText variant="bodySmall" color="muted" style={{ marginTop: 2 }}>
                      {sub.amountHint != null ? `${sub.currency} ${Number(sub.amountHint).toLocaleString()}` : 'No amount hint'}
                      {sub.nextExpectedCharge ? ` • next ${new Date(sub.nextExpectedCharge).toLocaleDateString()}` : ''}
                    </StewieText>
                  </View>
                  <View style={styles.subscriptionRowActions}>
                    <TouchableOpacity onPress={() => startEditSubscription(sub)} style={styles.subscriptionIconBtn}>
                      <Ionicons name="create-outline" size={16} color={StewiePayBrand.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteSubscription(sub.id)} style={styles.subscriptionIconBtn}>
                      <Ionicons name="trash-outline" size={16} color={StewiePayBrand.colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </GlassCard>

        {/* Recent Activity */}
        <GlassCard elevated intensity={35} style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <StewieText variant="titleLarge" color="primary" weight="bold">
              Recent Activity
            </StewieText>
            <TouchableOpacity
              onPress={() => navigation.navigate('Transactions', { cardId })}
              style={styles.linkButton}
            >
              <StewieText variant="labelMedium" color="primary" weight="semibold">
                View all
              </StewieText>
              <Ionicons name="chevron-forward" size={16} color={StewiePayBrand.colors.primary} />
            </TouchableOpacity>
          </View>
          {recentTxns.length === 0 ? (
            <StewieText variant="bodyMedium" color="muted">
              No transactions yet.
            </StewieText>
          ) : (
            <View style={styles.recentList}>
              {recentTxns.map((txn: any) => (
                <TouchableOpacity
                  key={txn.id}
                  style={styles.recentRow}
                  onPress={() => navigation.navigate('TransactionDetail', { transaction: txn })}
                  activeOpacity={0.7}
                >
                  <View style={styles.recentLeft}>
                    <View style={styles.recentIcon}>
                      <Ionicons name="receipt-outline" size={16} color={StewiePayBrand.colors.primary} />
                    </View>
                    <View>
                      <StewieText variant="bodyMedium" color="primary" weight="semibold">
                        {txn.merchantName || 'Unknown Merchant'}
                      </StewieText>
                      <StewieText variant="bodySmall" color="muted">
                        {new Date(txn.createdAt || txn.timestamp).toLocaleDateString()}
                      </StewieText>
                    </View>
                  </View>
                  <StewieText variant="bodyMedium" color="primary" weight="semibold">
                    ETB {Math.abs(txn.amount).toLocaleString()}
                  </StewieText>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </GlassCard>

        {/* Merchant Locks */}
        {card && <MerchantLockManager card={card} onUpdate={load} />}

        {/* Time Window Controls */}
        {card && (
          <TimeWindowManager
            cardId={card.id}
            initialEnabled={card.timeWindowEnabled || false}
            initialDaysOfWeek={
              card.timeWindowConfig ? JSON.parse(card.timeWindowConfig).daysOfWeek || [] : []
            }
            initialStartTime={
              card.timeWindowConfig ? JSON.parse(card.timeWindowConfig).startTime || '09:00' : '09:00'
            }
            initialEndTime={
              card.timeWindowConfig ? JSON.parse(card.timeWindowConfig).endTime || '17:00' : '17:00'
            }
            initialTimezone={
              card.timeWindowConfig
                ? JSON.parse(card.timeWindowConfig).timezone || 'Africa/Addis_Ababa'
                : 'Africa/Addis_Ababa'
            }
            onSave={load}
          />
        )}

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <ActionButton
            icon="list-outline"
            label="View Transactions"
            onPress={() => navigation.navigate('Transactions', { cardId })}
          />
          <ActionButton
            icon={card.status === 'FROZEN' ? 'play-outline' : 'snow-outline'}
            label={card.status === 'FROZEN' ? 'Unfreeze Card' : 'Freeze Card'}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleStatus();
            }}
            disabled={card.status === 'CLOSED' || toggling}
          />
          <ActionButton
            icon="settings-outline"
            label="Edit Limits"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('EditCardLimits', {
                cardId,
                limits: {
                  limitDaily: card.limitDaily,
                  limitMonthly: card.limitMonthly,
                  limitPerTxn: card.limitPerTxn,
                },
              });
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const LimitRow = ({ label, value, currency }: { label: string; value?: number; currency: string }) => {
  return (
    <View style={styles.limitRow}>
      <StewieText variant="bodyMedium" color="muted">
        {label}
      </StewieText>
      <StewieText variant="titleMedium" color="primary" weight="semibold">
        {value ? `${currency} ${value.toLocaleString()}` : 'No limit'}
      </StewieText>
    </View>
  );
};

const ActionButton = ({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.actionButton} disabled={disabled} activeOpacity={0.7}>
      <Ionicons name={icon} size={24} color={disabled ? StewiePayBrand.colors.textMuted : StewiePayBrand.colors.textPrimary} style={{ marginRight: StewiePayBrand.spacing.sm }} />
      <StewieText variant="titleMedium" color="primary" weight="semibold" style={{ flex: 1, color: disabled ? StewiePayBrand.colors.textMuted : StewiePayBrand.colors.textPrimary }}>
        {label}
      </StewieText>
      <Ionicons name="chevron-forward" size={20} color={disabled ? StewiePayBrand.colors.textMuted : StewiePayBrand.colors.textMuted} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: StewiePayBrand.colors.backgroundSecondary, // Gray background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: StewiePayBrand.colors.backgroundSecondary, // Gray background
  },
  cardContainer: {
    paddingHorizontal: StewiePayBrand.spacing.md,
    paddingTop: 60,
    paddingBottom: StewiePayBrand.spacing.lg,
  },
  summaryCard: {
    marginHorizontal: StewiePayBrand.spacing.md,
    marginBottom: StewiePayBrand.spacing.md,
    padding: StewiePayBrand.spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: StewiePayBrand.spacing.sm,
  },
  statusPill: {
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
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: StewiePayBrand.spacing.xs,
  },
  noticeText: {
    marginLeft: StewiePayBrand.spacing.sm,
    color: StewiePayBrand.colors.warning,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: StewiePayBrand.spacing.md,
    gap: StewiePayBrand.spacing.sm,
    marginBottom: StewiePayBrand.spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: StewiePayBrand.spacing.md,
  },
  section: {
    marginHorizontal: StewiePayBrand.spacing.md,
    marginBottom: StewiePayBrand.spacing.md,
    padding: StewiePayBrand.spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: StewiePayBrand.spacing.sm,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: StewiePayBrand.spacing.xs,
  },
  recentList: {
    gap: StewiePayBrand.spacing.sm,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: StewiePayBrand.spacing.sm,
    flex: 1,
  },
  recentIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${StewiePayBrand.colors.primary}20`,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: StewiePayBrand.spacing.md,
  },
  toggleLabel: {
    flex: 1,
    marginRight: StewiePayBrand.spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: StewiePayBrand.colors.surfaceVariant,
    marginVertical: StewiePayBrand.spacing.md,
  },
  limitsContainer: {
    gap: StewiePayBrand.spacing.md,
  },
  subscriptionForm: {
    marginBottom: StewiePayBrand.spacing.md,
    padding: StewiePayBrand.spacing.md,
    backgroundColor: `${StewiePayBrand.colors.surfaceVariant}66`,
    borderRadius: StewiePayBrand.radius.md,
    borderWidth: 1,
    borderColor: StewiePayBrand.colors.surfaceVariant
  },
  subscriptionLabel: {
    marginBottom: 6
  },
  subscriptionInput: {
    borderWidth: 1,
    borderColor: StewiePayBrand.colors.surfaceVariant,
    backgroundColor: StewiePayBrand.colors.surface,
    borderRadius: StewiePayBrand.radius.md,
    color: StewiePayBrand.colors.textPrimary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10
  },
  subscriptionFormRow: {
    flexDirection: 'row',
    gap: 10
  },
  subscriptionActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  subscriptionGhostButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: StewiePayBrand.radius.md,
    borderWidth: 1,
    borderColor: StewiePayBrand.colors.surfaceVariant
  },
  subscriptionPrimaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: StewiePayBrand.radius.md,
    backgroundColor: StewiePayBrand.colors.primary,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center'
  },
  subscriptionEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: StewiePayBrand.spacing.md
  },
  subscriptionList: {
    gap: 10
  },
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: StewiePayBrand.colors.surfaceVariant,
    borderRadius: StewiePayBrand.radius.md,
    padding: StewiePayBrand.spacing.sm
  },
  subscriptionRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: StewiePayBrand.spacing.sm
  },
  subscriptionIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${StewiePayBrand.colors.surfaceVariant}88`
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionsContainer: {
    paddingHorizontal: StewiePayBrand.spacing.md,
    gap: StewiePayBrand.spacing.sm,
    marginBottom: StewiePayBrand.spacing['3xl'],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: StewiePayBrand.colors.surfaceElevated,
    borderRadius: StewiePayBrand.radius.md,
    padding: StewiePayBrand.spacing.md,
    borderWidth: 1,
    borderColor: StewiePayBrand.colors.surfaceVariant,
  },
});
