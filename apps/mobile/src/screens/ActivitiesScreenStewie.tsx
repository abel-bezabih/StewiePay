import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { AnalyticsAPI, TransactionsAPI } from '../api/client';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieText } from '../components/stewiepay/StewieText';
import { GlassCard } from '../components/modern/GlassCard';
import { SkeletonLoader, SkeletonCard, SkeletonList } from '../components/modern/SkeletonLoader';
import { getCategoryIcon, getCategoryColor } from '../utils/category-utils';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type TabType = 'transactions' | 'spending' | 'history';

export const ActivitiesScreenStewie = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<TabType>('transactions');
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Text color override for new color scheme
  const textPrimary = '#111827';
  const textMuted = '#6B7280';

  const loadData = async () => {
    try {
      const [txnsResp, categoryResp] = await Promise.all([
        TransactionsAPI.list().catch(() => ({ data: [] })),
        AnalyticsAPI.spendByCategory().catch(() => ({ data: [] })),
      ]);

      setTransactions(txnsResp.data || []);
      setCategoryData(categoryResp.data || []);
    } catch (e) {
      console.error('Failed to load activities:', e);
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
  }, []);

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group transactions by date for History
  const groupedTransactions = (Array.isArray(transactions) ? transactions : []).reduce((acc: any, txn: any) => {
    const date = formatDate(txn.createdAt || txn.timestamp);
    if (!acc[date]) acc[date] = [];
    acc[date].push(txn);
    return acc;
  }, {});

  const historyDates = Object.keys(groupedTransactions || {}).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  const renderTabButton = (tab: TabType, label: string, icon: string) => (
    <TouchableOpacity
      key={tab}
      onPress={() => {
        setActiveTab(tab);
      }}
      style={[
        styles.tabButton,
        activeTab === tab && styles.tabButtonActive,
      ]}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={activeTab === tab ? StewiePayBrand.colors.primary : '#6B7280'}
      />
      <StewieText
        variant="labelMedium"
        style={{
          color: activeTab === tab ? StewiePayBrand.colors.primary : '#6B7280',
          marginLeft: 6,
          fontWeight: activeTab === tab ? '600' : '500',
        }}
      >
        {label}
      </StewieText>
    </TouchableOpacity>
  );

  const renderTransactions = () => {
    if (loading) {
      return (
        <View style={styles.content}>
          <SkeletonList count={5} />
        </View>
      );
    }

    if (transactions.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#9CA3AF" style={{ marginBottom: StewiePayBrand.spacing.lg }} />
          <StewieText variant="titleLarge" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.sm }}>
            No Transactions Yet
          </StewieText>
          <StewieText variant="bodyMedium" color="muted" style={{ textAlign: 'center', paddingHorizontal: StewiePayBrand.spacing.lg }}>
            Your transactions will appear here
          </StewieText>
        </View>
      );
    }

    return (
      <View style={styles.content}>
        {transactions.slice(0, 20).map((txn: any, index: number) => (
          <Animated.View
            key={txn.id || index}
            entering={FadeInDown.delay(index * 30).duration(300)}
          >
            <GlassCard elevated intensity={35} style={styles.transactionCard}>
              <View style={styles.transactionRow}>
                <View style={[styles.categoryIcon, { backgroundColor: `${getCategoryColor(txn.category)}20` }]}>
                  <Ionicons
                    name={getCategoryIcon(txn.category) as any}
                    size={24}
                    color={getCategoryColor(txn.category)}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <StewieText variant="bodyLarge" color="primary" weight="medium">
                    {txn.merchantName || 'Unknown Merchant'}
                  </StewieText>
                  <StewieText variant="bodySmall" color="muted" style={{ marginTop: 2 }}>
                    {new Date(txn.createdAt || txn.timestamp).toLocaleDateString()}
                  </StewieText>
                </View>
                <View style={styles.transactionAmount}>
                  <StewieText variant="titleMedium" color="primary" weight="bold">
                    ETB {Math.abs(txn.amount).toLocaleString()}
                  </StewieText>
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        ))}
      </View>
    );
  };

  const renderSpending = () => {
    if (loading) {
      return (
        <View style={styles.content}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }

    if (categoryData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="stats-chart-outline" size={64} color="#9CA3AF" style={{ marginBottom: StewiePayBrand.spacing.lg }} />
          <StewieText variant="titleLarge" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.sm }}>
            No Spending Data Yet
          </StewieText>
          <StewieText variant="bodyMedium" color="muted" style={{ textAlign: 'center', paddingHorizontal: StewiePayBrand.spacing.lg }}>
            Start making transactions to see your spending insights
          </StewieText>
        </View>
      );
    }

    return (
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
          <GlassCard elevated intensity={35}>
            <StewieText variant="titleLarge" color="primary" weight="bold" style={styles.sectionTitle}>
              Spending by Category
            </StewieText>
            <View style={styles.categoryList}>
              {categoryData.map((item, index) => (
                <Animated.View
                  key={item.category || 'Other'}
                  entering={FadeInDown.delay(150 + index * 30).duration(300)}
                >
                  <TouchableOpacity style={styles.categoryItem}>
                    <View style={styles.categoryItemLeft}>
                      <View style={[styles.categoryIcon, { backgroundColor: `${getCategoryColor(item.category)}20` }]}>
                        <Ionicons
                          name={getCategoryIcon(item.category) as any}
                          size={24}
                          color={getCategoryColor(item.category)}
                        />
                      </View>
                      <View style={styles.categoryInfo}>
                        <StewieText variant="titleMedium" color="primary" weight="semibold">
                          {item.category}
                        </StewieText>
                        <StewieText variant="bodySmall" color="muted">
                          {item.count} {item.count === 1 ? 'transaction' : 'transactions'}
                        </StewieText>
                      </View>
                    </View>
                    <View style={styles.categoryAmount}>
                      <StewieText variant="titleMedium" color="primary" weight="bold">
                        ETB {item.amount?.toLocaleString() || '0'}
                      </StewieText>
                      <StewieText variant="bodySmall" color="muted">
                        {item.percentage?.toFixed(1) || '0'}%
                      </StewieText>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>
      </View>
    );
  };

  const renderHistory = () => {
    if (loading) {
      return (
        <View style={styles.content}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }

    if (historyDates.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color="#9CA3AF" style={{ marginBottom: StewiePayBrand.spacing.lg }} />
          <StewieText variant="titleLarge" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.sm }}>
            No History Yet
          </StewieText>
          <StewieText variant="bodyMedium" color="muted" style={{ textAlign: 'center', paddingHorizontal: StewiePayBrand.spacing.lg }}>
            Your transaction history will appear here
          </StewieText>
        </View>
      );
    }

    return (
      <View style={styles.content}>
        {historyDates.map((date, dateIndex) => (
          <Animated.View
            key={date}
            entering={FadeInDown.delay(dateIndex * 50).duration(300)}
            style={styles.historySection}
          >
            <StewieText variant="labelLarge" color="muted" style={styles.historyDate}>
              {date}
            </StewieText>
            {groupedTransactions[date].map((txn: any, index: number) => (
              <GlassCard key={txn.id || index} elevated intensity={35} style={styles.transactionCard}>
                <View style={styles.transactionRow}>
                  <View style={[styles.categoryIcon, { backgroundColor: `${getCategoryColor(txn.category)}20` }]}>
                    <Ionicons
                      name={getCategoryIcon(txn.category) as any}
                      size={24}
                      color={getCategoryColor(txn.category)}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <StewieText variant="bodyLarge" color="primary" weight="medium">
                      {txn.merchantName || 'Unknown Merchant'}
                    </StewieText>
                    <StewieText variant="bodySmall" color="muted" style={{ marginTop: 2 }}>
                      {txn.category || 'Other'}
                    </StewieText>
                  </View>
                  <View style={styles.transactionAmount}>
                    <StewieText variant="titleMedium" color="primary" weight="bold">
                      ETB {Math.abs(txn.amount).toLocaleString()}
                    </StewieText>
                  </View>
                </View>
              </GlassCard>
            ))}
          </Animated.View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={StewiePayBrand.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <StewieText variant="headlineLarge" color="primary" weight="black" style={{ color: StewiePayBrand.colors.primary }}>
            Activities
          </StewieText>
          <StewieText variant="bodyMedium" color="muted" style={{ marginTop: StewiePayBrand.spacing.xs }}>
            Transactions, Spending & History
          </StewieText>
        </Animated.View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {renderTabButton('transactions', 'Transactions', 'receipt-outline')}
          {renderTabButton('spending', 'Spending', 'stats-chart-outline')}
          {renderTabButton('history', 'History', 'time-outline')}
        </View>

        {/* Content */}
        {activeTab === 'transactions' && renderTransactions()}
        {activeTab === 'spending' && renderSpending()}
        {activeTab === 'history' && renderHistory()}

        <View style={{ height: StewiePayBrand.spacing.xl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 110,
    paddingBottom: StewiePayBrand.spacing.md,
    paddingHorizontal: StewiePayBrand.spacing.lg,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: StewiePayBrand.spacing.lg,
    marginBottom: StewiePayBrand.spacing.md,
    gap: StewiePayBrand.spacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: StewiePayBrand.spacing.sm,
    paddingHorizontal: StewiePayBrand.spacing.md,
    borderRadius: StewiePayBrand.radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabButtonActive: {
    backgroundColor: StewiePayBrand.colors.primary + '15',
    borderColor: StewiePayBrand.colors.primary,
  },
  content: {
    paddingHorizontal: StewiePayBrand.spacing.lg,
    gap: StewiePayBrand.spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: StewiePayBrand.spacing['3xl'],
    paddingHorizontal: StewiePayBrand.spacing.lg,
  },
  transactionCard: {
    marginBottom: StewiePayBrand.spacing.sm,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: StewiePayBrand.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: StewiePayBrand.spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  section: {
    marginBottom: StewiePayBrand.spacing.md,
  },
  sectionTitle: {
    marginBottom: StewiePayBrand.spacing.lg,
  },
  categoryList: {
    gap: StewiePayBrand.spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: StewiePayBrand.spacing.md,
    borderRadius: StewiePayBrand.radius.md,
    marginBottom: StewiePayBrand.spacing.sm,
  },
  categoryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  historySection: {
    marginBottom: StewiePayBrand.spacing.lg,
  },
  historyDate: {
    marginBottom: StewiePayBrand.spacing.sm,
    marginTop: StewiePayBrand.spacing.md,
    paddingHorizontal: StewiePayBrand.spacing.sm,
  },
});

