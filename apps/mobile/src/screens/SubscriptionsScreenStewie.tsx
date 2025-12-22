import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SubscriptionsAPI } from '../api/client';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieCard } from '../components/stewiepay/StewieCard';
import { StewieText } from '../components/stewiepay/StewieText';
import { GlassCard } from '../components/modern/GlassCard';
import { SkeletonLoader, SkeletonCard, SkeletonList } from '../components/modern/SkeletonLoader';
import { BackButton } from '../components/navigation/BackButton';
import { Ionicons } from '@expo/vector-icons';

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `In ${diffDays} days`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getDaysUntil = (dateString?: string): number => {
  if (!dateString) return 999;
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export const SubscriptionsScreenStewie = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const resp = await SubscriptionsAPI.list();
      setSubscriptions(resp.data || []);
    } catch (e) {
      console.error('Failed to load subscriptions:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  const handleDelete = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await SubscriptionsAPI.delete(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadData();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Failed to delete subscription:', e);
    }
    setMenuVisible(null);
  };

  const totalMonthly = subscriptions.reduce((sum, sub) => sum + (sub.amountHint || 0), 0);
  const upcomingCount = subscriptions.filter(
    (sub) => getDaysUntil(sub.nextExpectedCharge) >= 0 && getDaysUntil(sub.nextExpectedCharge) <= 7
  ).length;

  if (loading) {
    return (
      <View style={styles.container}>
        <BackButton />
        <ScrollView contentContainerStyle={styles.loadingContent}>
          <View style={styles.header}>
            <SkeletonLoader width={200} height={32} borderRadius={8} />
            <SkeletonLoader width={250} height={16} borderRadius={8} style={{ marginTop: 8 }} />
          </View>
          <View style={styles.statsContainer}>
            {[1, 2].map((i) => (
              <SkeletonLoader key={i} width="48%" height={100} borderRadius={StewiePayBrand.radius.xl} />
            ))}
          </View>
          <SkeletonList count={3} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={StewiePayBrand.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* StewiePay Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <StewieText variant="headlineLarge" color="primary" weight="black">
            Subscriptions
          </StewieText>
          <StewieText variant="bodyMedium" color="muted" style={{ marginTop: StewiePayBrand.spacing.xs }}>
            {subscriptions.length} {subscriptions.length === 1 ? 'subscription' : 'subscriptions'} • Auto-detected
          </StewieText>
        </Animated.View>

        {subscriptions.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyContainer}>
            <Ionicons name="repeat-outline" size={64} color={StewiePayBrand.colors.textMuted} style={{ marginBottom: StewiePayBrand.spacing.lg }} />
            <StewieText variant="titleLarge" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.sm }}>
              No Subscriptions Yet
            </StewieText>
            <StewieText variant="bodyMedium" color="muted" style={{ textAlign: 'center', paddingHorizontal: StewiePayBrand.spacing.lg }}>
              Subscriptions will be automatically detected from your recurring transactions
            </StewieText>
          </Animated.View>
        ) : (
          <>
            {/* Stats Cards */}
            <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.statsContainer}>
              <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                <GlassCard elevated intensity={35} style={styles.statCard}>
                  <StewieText variant="labelMedium" color="muted" style={{ marginBottom: StewiePayBrand.spacing.sm }}>
                    Monthly Total
                  </StewieText>
                  <StewieText variant="displaySmall" color="primary" weight="black">
                    ETB {totalMonthly.toLocaleString()}
                  </StewieText>
                </GlassCard>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(150).duration(400)}>
                <GlassCard elevated intensity={35} style={styles.statCard}>
                  <StewieText variant="labelMedium" color="muted" style={{ marginBottom: StewiePayBrand.spacing.sm }}>
                    Upcoming (7 days)
                  </StewieText>
                  <StewieText variant="displaySmall" color="primary" weight="black">
                    {upcomingCount}
                  </StewieText>
                </GlassCard>
              </Animated.View>
            </Animated.View>

            {/* Subscriptions List */}
            <View style={styles.listContainer}>
              {subscriptions.map((sub, index) => {
                const daysUntil = getDaysUntil(sub.nextExpectedCharge);
                const isUpcoming = daysUntil >= 0 && daysUntil <= 7;
                const isOverdue = daysUntil < 0;

                return (
                  <Animated.View
                    key={sub.id}
                    entering={FadeInDown.delay(200 + index * 30).duration(400)}
                  >
                    <GlassCard
                      elevated
                      intensity={35}
                      style={[
                        styles.subscriptionCard,
                        {
                          borderLeftWidth: 4,
                          borderLeftColor: isOverdue
                            ? StewiePayBrand.colors.error
                            : isUpcoming
                            ? StewiePayBrand.colors.primary
                            : StewiePayBrand.colors.surfaceVariant,
                        },
                      ]}
                    >
                      <View style={styles.cardContent}>
                        <View style={styles.subscriptionHeader}>
                          <View style={styles.subscriptionInfo}>
                            <StewieText variant="titleMedium" color="primary" weight="bold">
                              {sub.merchant}
                            </StewieText>
                            {sub.amountHint && (
                              <StewieText variant="displaySmall" color="primary" weight="black" style={{ marginTop: StewiePayBrand.spacing.xs }}>
                                ETB {sub.amountHint.toLocaleString()}
                              </StewieText>
                            )}
                            {sub.card && (
                              <View style={styles.cardChip}>
                                <StewieText variant="labelSmall" color="muted">
                                  Card: {sub.card.issuerCardId.slice(-4)}
                                </StewieText>
                              </View>
                            )}
                          </View>
                          <TouchableOpacity
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setMenuVisible(menuVisible === sub.id ? null : sub.id);
                            }}
                          >
                            <Ionicons name="ellipsis-vertical" size={20} color={StewiePayBrand.colors.textMuted} />
                          </TouchableOpacity>
                        </View>

                        {menuVisible === sub.id && (
                          <View style={styles.menu}>
                            <TouchableOpacity
                              style={styles.menuItem}
                              onPress={() => {
                                setMenuVisible(null);
                                // TODO: Edit subscription
                              }}
                            >
                              <Ionicons name="pencil" size={18} color={StewiePayBrand.colors.textSecondary} />
                              <StewieText variant="bodyMedium" color="secondary" style={{ marginLeft: StewiePayBrand.spacing.sm }}>
                                Edit
                              </StewieText>
                            </TouchableOpacity>
                            <View style={styles.menuDivider} />
                            <TouchableOpacity
                              style={styles.menuItem}
                              onPress={() => handleDelete(sub.id)}
                            >
                              <Ionicons name="trash-outline" size={18} color={StewiePayBrand.colors.error} />
                              <StewieText variant="bodyMedium" color="error" style={{ marginLeft: StewiePayBrand.spacing.sm }}>
                                Delete
                              </StewieText>
                            </TouchableOpacity>
                          </View>
                        )}

                        <View style={styles.subscriptionMeta}>
                          <View style={styles.metaRow}>
                            <StewieText variant="bodySmall" color="muted">
                              Next Charge:
                            </StewieText>
                            <View style={styles.nextChargeContainer}>
                              <StewieText
                                variant="bodyMedium"
                                weight="semibold"
                                style={{
                                  color: isOverdue
                                    ? StewiePayBrand.colors.error
                                    : isUpcoming
                                    ? StewiePayBrand.colors.primary
                                    : StewiePayBrand.colors.textPrimary,
                                }}
                              >
                                {formatDate(sub.nextExpectedCharge)}
                              </StewieText>
                              {sub.nextExpectedCharge && (
                                <StewieText variant="bodySmall" color="muted" style={{ marginLeft: StewiePayBrand.spacing.sm }}>
                                  ({new Date(sub.nextExpectedCharge).toLocaleDateString()})
                                </StewieText>
                              )}
                            </View>
                          </View>
                          {sub.lastChargeAt && (
                            <View style={styles.metaRow}>
                              <StewieText variant="bodySmall" color="muted">
                                Last Charge:
                              </StewieText>
                              <StewieText variant="bodySmall" color="secondary">
                                {new Date(sub.lastChargeAt).toLocaleDateString()}
                              </StewieText>
                            </View>
                          )}
                        </View>
                      </View>
                    </GlassCard>
                  </Animated.View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
      <BackButton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: StewiePayBrand.colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: StewiePayBrand.colors.backgroundSecondary,
  },
  loadingContent: {
    padding: StewiePayBrand.spacing.lg,
    paddingTop: 130, // Even more space below back button
  },
  header: {
    paddingTop: 110, // Even more space below back button
    paddingBottom: StewiePayBrand.spacing.md,
    paddingHorizontal: StewiePayBrand.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    padding: StewiePayBrand.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: StewiePayBrand.spacing.md,
    gap: StewiePayBrand.spacing.sm,
    marginBottom: StewiePayBrand.spacing.md,
  },
  statCard: {
    flex: 1,
    padding: StewiePayBrand.spacing.md,
  },
  listContainer: {
    paddingHorizontal: StewiePayBrand.spacing.md,
    paddingBottom: StewiePayBrand.spacing['3xl'],
  },
  subscriptionCard: {
    marginBottom: StewiePayBrand.spacing.md,
  },
  cardContent: {
    padding: StewiePayBrand.spacing.md,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: StewiePayBrand.spacing.md,
  },
  subscriptionInfo: {
    flex: 1,
  },
  cardChip: {
    backgroundColor: StewiePayBrand.colors.surfaceElevated,
    paddingHorizontal: StewiePayBrand.spacing.sm,
    paddingVertical: StewiePayBrand.spacing.xs,
    borderRadius: StewiePayBrand.radius.sm,
    alignSelf: 'flex-start',
    marginTop: StewiePayBrand.spacing.sm,
  },
  menu: {
    backgroundColor: StewiePayBrand.colors.surfaceElevated,
    borderRadius: StewiePayBrand.radius.md,
    padding: StewiePayBrand.spacing.xs,
    marginBottom: StewiePayBrand.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: StewiePayBrand.spacing.sm,
  },
  menuDivider: {
    height: 1,
    backgroundColor: StewiePayBrand.colors.surfaceVariant,
    marginVertical: StewiePayBrand.spacing.xs,
  },
  subscriptionMeta: {
    gap: StewiePayBrand.spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextChargeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

