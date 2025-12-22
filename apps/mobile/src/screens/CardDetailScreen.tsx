import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Switch } from 'react-native';
import { CardsAPI, TransactionsAPI } from '../api/client';
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
        (t: any) => new Date(t.timestamp).toDateString() === now.toDateString(),
      );
      const thisMonth = txns.filter(
        (t: any) => new Date(t.timestamp).getMonth() === now.getMonth(),
      );

      setStats({
        today: today.reduce((sum: number, t: any) => sum + t.amount, 0),
        thisMonth: thisMonth.reduce((sum: number, t: any) => sum + t.amount, 0),
        transactions: txns.length,
      });
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
        <ActivityIndicator size="large" color={StewiePayBrand.colors.primary} />
        <StewieText variant="bodyMedium" color="muted" style={{ marginTop: StewiePayBrand.spacing.md }}>
          Loading card...
        </StewieText>
      </View>
    );
  }

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
                {card.status === 'FROZEN' ? 'Card Frozen' : 'Card Active'}
              </StewieText>
              <StewieText variant="bodySmall" color="muted">
                {card.status === 'FROZEN'
                  ? 'This card is frozen and cannot be used'
                  : 'Freeze this card to prevent all transactions'}
              </StewieText>
            </View>
            <Switch
              value={card.status === 'FROZEN'}
              onValueChange={toggleStatus}
              disabled={toggling}
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
            icon="settings-outline"
            label="Edit Limits"
            onPress={() => {
              // TODO: Navigate to edit limits screen
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

const ActionButton = ({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.actionButton}>
      <Ionicons name={icon} size={24} color={StewiePayBrand.colors.textPrimary} style={{ marginRight: StewiePayBrand.spacing.sm }} />
      <StewieText variant="titleMedium" color="primary" weight="semibold" style={{ flex: 1 }}>
        {label}
      </StewieText>
      <Ionicons name="chevron-forward" size={20} color={StewiePayBrand.colors.textMuted} />
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
