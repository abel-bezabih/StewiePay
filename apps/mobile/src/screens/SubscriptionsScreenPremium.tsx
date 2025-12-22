import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { SubscriptionsAPI } from '../api/client';
import { EmptyState } from '../components/EmptyState';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { BrandButton } from '../components/BrandButton';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import * as Haptics from 'expo-haptics';

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

export const SubscriptionsScreenPremium = ({ navigation }: any) => {
  // const theme = useTheme(); // Removed - react-native-paper not available
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
      <View style={[styles.loadingContainer, { backgroundColor: StewiePayBrand.colors.background }]}>
        <ActivityIndicator size="large" color={StewiePayBrand.colors.primary} />
        <Text  style={{ color: StewiePayBrand.colors.textMuted, marginTop: 16 }}>
          Loading subscriptions...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: StewiePayBrand.colors.background }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text  style={styles.headerTitle}>
            Subscriptions
          </Text>
        </View>

        {subscriptions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="🔄"
              title="No subscriptions yet"
              subtitle="Subscriptions will be automatically detected from your recurring transactions"
            />
          </View>
        ) : (
          <>
            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <Animatable.View animation="fadeInUp" delay={100} duration={400}>
                <View style={styles.statCard}>
                  <Text  style={{ color: StewiePayBrand.colors.textMuted, marginBottom: 8 }}>
                    Monthly Total
                  </Text>
                  <AnimatedCounter
                    value={totalMonthly}
                    prefix="ETB "
                    useSpring={true}
                    style={{ fontSize: 28, fontWeight: '900', color: StewiePayBrand.colors.textPrimary }}
                  />
                </View>
              </Animatable.View>

              <Animatable.View animation="fadeInUp" delay={200} duration={400}>
                <View style={styles.statCard}>
                  <Text  style={{ color: StewiePayBrand.colors.textMuted, marginBottom: 8 }}>
                    Upcoming (7 days)
                  </Text>
                  <AnimatedCounter
                    value={upcomingCount}
                    useSpring={true}
                    style={{ fontSize: 28, fontWeight: '900', color: StewiePayBrand.colors.textPrimary }}
                  />
                </View>
              </Animatable.View>
            </View>

            {/* Subscriptions List */}
            <View style={styles.listContainer}>
              {subscriptions.map((sub, index) => {
                const daysUntil = getDaysUntil(sub.nextExpectedCharge);
                const isUpcoming = daysUntil >= 0 && daysUntil <= 7;
                const isOverdue = daysUntil < 0;

                return (
                  <Animatable.View
                    key={sub.id}
                    animation="fadeInUp"
                    delay={300 + index * 50}
                    duration={400}
                  >
                    <View
                      style={[
                        styles.subscriptionCard,
                        {
                          borderLeftWidth: 4,
                          borderLeftColor: isOverdue
                            ? StewiePayBrand.colors.error
                            : isUpcoming
                            ? StewiePayBrand.colors.primary
                            : StewiePayBrand.colors.textMuted
                        }
                      ]}
                    >
                      <View style={styles.cardContent}>
                        <View style={styles.subscriptionHeader}>
                          <View style={styles.subscriptionInfo}>
                            <Text  style={{ fontWeight: '700', color: StewiePayBrand.colors.textPrimary }}>
                              {sub.merchant}
                            </Text>
                            {sub.amountHint && (
                              <AnimatedCounter
                                value={sub.amountHint}
                                prefix="ETB "
                                useSpring={true}
                                style={{ fontSize: 24, fontWeight: '800', marginTop: 4, color: StewiePayBrand.colors.textPrimary }}
                              />
                            )}
                            {sub.card && (
                              <View
                                style={{
                                  backgroundColor: StewiePayBrand.colors.surfaceVariant,
                                  marginTop: 8,
                                  alignSelf: 'flex-start',
                                  paddingHorizontal: 8,
                                  paddingVertical: 4,
                                  borderRadius: 12
                                }}
                              >
                                <Text style={{ fontSize: 11 }}>
                                  Card: {sub.card.issuerCardId.slice(-4)}
                                </Text>
                              </View>
                            )}
                          </View>
                          <TouchableOpacity
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setMenuVisible(menuVisible === sub.id ? null : sub.id);
                            }}
                            style={{ padding: 8 }}
                          >
                            <Text style={{ fontSize: 20 }}>⋮</Text>
                          </TouchableOpacity>
                          {menuVisible === sub.id && (
                            <View style={{ position: 'absolute', right: 0, top: 40, backgroundColor: StewiePayBrand.colors.surface, borderRadius: 8, padding: 8, zIndex: 1000 }}>
                              <TouchableOpacity
                                onPress={() => {
                                  setMenuVisible(null);
                                  // TODO: Navigate to edit subscription
                                }}
                                style={{ padding: 12 }}
                              >
                                <Text style={{ color: StewiePayBrand.colors.textPrimary }}>Edit</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => {
                                  setMenuVisible(null);
                                  handleDelete(sub.id);
                                }}
                                style={{ padding: 12 }}
                              >
                                <Text style={{ color: StewiePayBrand.colors.error }}>Delete</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>

                        <View style={{ height: 1, backgroundColor: StewiePayBrand.colors.surfaceVariant, marginVertical: 12 }} />

                        <View style={styles.subscriptionMeta}>
                          <View style={styles.metaRow}>
                            <Text  style={{ color: StewiePayBrand.colors.textMuted }}>
                              Next Charge:
                            </Text>
                            <View style={styles.nextChargeContainer}>
                              <Text
                                
                                style={{
                                  fontWeight: '700',
                                  color:
                                    isOverdue
                                      ? StewiePayBrand.colors.error
                                      : isUpcoming
                                      ? StewiePayBrand.colors.primary
                                      : StewiePayBrand.colors.textPrimary
                                }}
                              >
                                {formatDate(sub.nextExpectedCharge)}
                              </Text>
                              {sub.nextExpectedCharge && (
                                <Text
                                  
                                  style={{
                                    color: StewiePayBrand.colors.textMuted,
                                    marginLeft: 8
                                  }}
                                >
                                  ({new Date(sub.nextExpectedCharge).toLocaleDateString()})
                                </Text>
                              )}
                            </View>
                          </View>
                          {sub.lastChargeAt && (
                            <View style={styles.metaRow}>
                              <Text  style={{ color: StewiePayBrand.colors.textMuted }}>
                                Last Charge:
                              </Text>
                              <Text  style={{ color: StewiePayBrand.colors.textPrimary }}>
                                {new Date(sub.lastChargeAt).toLocaleDateString()}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </Animatable.View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
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
  emptyContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12
  },
  statCard: {
    flex: 1,
    marginHorizontal: StewiePayBrand.spacing.sm,
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 12
  },
  listContainer: {
    padding: StewiePayBrand.spacing.lg,
    paddingTop: 0
  },
  subscriptionCard: {
    marginBottom: StewiePayBrand.spacing.md,
    marginHorizontal: StewiePayBrand.spacing.lg,
    backgroundColor: '#1A1A1A',
    borderRadius: 12
  },
  cardContent: {
    padding: 16
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  subscriptionInfo: {
    flex: 1
  },
  subscriptionMeta: {
    gap: 8
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  nextChargeContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  }
});

