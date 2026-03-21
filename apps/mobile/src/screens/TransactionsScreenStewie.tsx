import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  SectionList,
  ScrollView,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { TransactionsAPI } from '../api/client';
import { getCategoryIcon, getCategoryColor } from '../utils/category-utils';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieCard } from '../components/stewiepay/StewieCard';
import { StewieText } from '../components/stewiepay/StewieText';
import { GlassCard } from '../components/modern/GlassCard';
import { SkeletonLoader, SkeletonList } from '../components/modern/SkeletonLoader';
import { Ionicons } from '@expo/vector-icons';

const formatDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatSectionDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const groupTransactionsByDate = (transactions: any[] | undefined | null) => {
  const grouped: { [key: string]: any[] } = {};
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  safeTransactions.forEach(txn => {
    const date = new Date(txn.createdAt);
    const dateKey = date.toDateString();
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(txn);
  });

  return Object.keys(grouped || {})
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .map(dateKey => ({
      title: formatSectionDate(grouped[dateKey][0].createdAt),
      data: grouped[dateKey].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    }));
};

interface TransactionItemProps {
  transaction: any;
  onPress?: () => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onPress }) => {
  const categoryIcon = getCategoryIcon(transaction.category);
  const categoryColor = getCategoryColor(transaction.category);
  const isNegative = transaction.amount < 0;
  const amount = Math.abs(transaction.amount);
  const isSettled = transaction.status === 'SETTLED';
  const isDeclined = transaction.status === 'DECLINED';
  const isPending = transaction.status === 'AUTHORIZED';
  const statusLabel = isSettled ? 'Settled' : isDeclined ? 'Declined' : 'Pending';
  const statusColor = isSettled
    ? StewiePayBrand.colors.success
    : isDeclined
      ? StewiePayBrand.colors.error
      : StewiePayBrand.colors.warning;

  return (
    <GlassCard
      onPress={onPress}
      style={styles.transactionCard}
      elevated
      intensity={15}
    >
        <View style={styles.transactionContent}>
          {/* Category Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${categoryColor}20` },
            ]}
          >
            <StewieText variant="titleLarge" style={{ fontSize: 24 }}>
              {categoryIcon}
            </StewieText>
          </View>

          {/* Merchant Info */}
          <View style={styles.merchantInfo}>
            <View style={styles.merchantRow}>
              <StewieText variant="titleMedium" color="primary" weight="semibold" numberOfLines={1}>
                {transaction.merchantName || 'Unknown Merchant'}
              </StewieText>
            </View>
            <View style={styles.metaRow}>
              <StewieText variant="bodySmall" color="muted">
                {formatDate(transaction.createdAt)}
              </StewieText>
              <View style={[styles.statusPill, { backgroundColor: `${statusColor}20` }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <StewieText variant="labelSmall" weight="semibold" style={{ color: statusColor }}>
                  {statusLabel}
                </StewieText>
              </View>
            </View>
          </View>

          {/* Amount */}
          <View style={styles.amountContainer}>
            <StewieText
              variant="titleLarge"
              weight="bold"
              style={{
                color: isNegative
                  ? StewiePayBrand.colors.textPrimary
                  : StewiePayBrand.colors.secondary,
              }}
            >
              {isNegative ? '-' : '+'}ETB {amount.toLocaleString()}
            </StewieText>
          </View>
        </View>
      </GlassCard>
  );
};

export const TransactionsScreenStewie = ({ navigation, route }: any) => {
  const cardId = route?.params?.cardId;
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SETTLED' | 'AUTHORIZED' | 'DECLINED'>('ALL');
  const [dateRangeDays, setDateRangeDays] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (dateRangeDays) {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - dateRangeDays);
        params.startDate = start.toISOString();
        params.endDate = now.toISOString();
      }
      const resp = await TransactionsAPI.list(cardId, params);
      setTxns(resp.data || []);
    } catch (e) {
      console.error('Failed to load transactions:', e);
    } finally {
      setLoading(false);
    }
  }, [cardId, debouncedSearch, categoryFilter, statusFilter, dateRangeDays]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    load();
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  const categories = Array.from(new Set(txns.map((t) => t.category).filter(Boolean)));
  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    Boolean(categoryFilter) ||
    statusFilter !== 'ALL' ||
    Boolean(dateRangeDays);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalSpent = txns
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalReceived = txns
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const todaySpent = txns
      .filter(t => {
        const txnDate = new Date(t.createdAt);
        const today = new Date();
        return t.amount < 0 && txnDate.toDateString() === today.toDateString();
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return { totalSpent, totalReceived, todaySpent };
  }, [txns]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    return groupTransactionsByDate(txns);
  }, [txns]);

  return (
    <View style={styles.container}>
      {/* StewiePay Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <StewieText variant="headlineLarge" color="primary" weight="black">
          Transactions
        </StewieText>
        <StewieText variant="bodyMedium" color="muted" style={{ marginTop: StewiePayBrand.spacing.xs }}>
          {txns.length} {txns.length === 1 ? 'transaction' : 'transactions'}
        </StewieText>
      </Animated.View>

      {/* Summary Stats */}
      {txns.length > 0 && (
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <View style={styles.statsContainer}>
            <GlassCard elevated intensity={15} style={styles.statCard}>
              <StewieText variant="labelSmall" color="muted" style={{ marginBottom: StewiePayBrand.spacing.xs }}>
                Today
              </StewieText>
              <StewieText variant="titleLarge" color="primary" weight="bold">
                ETB {summaryStats.todaySpent.toLocaleString()}
              </StewieText>
            </GlassCard>
            <GlassCard elevated intensity={15} style={styles.statCard}>
              <StewieText variant="labelSmall" color="muted" style={{ marginBottom: StewiePayBrand.spacing.xs }}>
                Total Spent
              </StewieText>
              <StewieText variant="titleLarge" color="primary" weight="bold">
                ETB {summaryStats.totalSpent.toLocaleString()}
              </StewieText>
            </GlassCard>
            {summaryStats.totalReceived > 0 && (
              <GlassCard elevated intensity={15} style={styles.statCard}>
                <StewieText variant="labelSmall" color="muted" style={{ marginBottom: StewiePayBrand.spacing.xs }}>
                  Received
                </StewieText>
                <StewieText variant="titleLarge" color="secondary" weight="bold">
                  ETB {summaryStats.totalReceived.toLocaleString()}
                </StewieText>
              </GlassCard>
            )}
          </View>
        </Animated.View>
      )}

      {/* Search Bar */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.searchContainer}>
        <GlassCard elevated intensity={10} style={styles.searchCard}>
          <View style={styles.searchContent}>
            <Ionicons name="search" size={20} color={StewiePayBrand.colors.textMuted} />
            <TextInput
              placeholder="Search transactions..."
              placeholderTextColor={StewiePayBrand.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSearchQuery('');
                }}
              >
                <Ionicons name="close-circle" size={20} color={StewiePayBrand.colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </GlassCard>
      </Animated.View>

      {/* Filters */}
      <Animated.View entering={FadeInDown.delay(125).duration(400)} style={styles.filtersRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { label: 'All time', value: null },
            { label: '7 days', value: 7 },
            { label: '30 days', value: 30 },
          ]}
          keyExtractor={(item) => item.label}
          renderItem={({ item }) => {
            const isSelected = dateRangeDays === item.value;
            return (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDateRangeDays(item.value);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected
                      ? StewiePayBrand.colors.primary
                      : StewiePayBrand.colors.surface,
                    borderColor: isSelected
                      ? StewiePayBrand.colors.primary
                      : StewiePayBrand.colors.surfaceVariant,
                  },
                ]}
              >
                <StewieText
                  variant="labelMedium"
                  color={isSelected ? 'primary' : 'secondary'}
                  weight={isSelected ? 'semibold' : 'regular'}
                >
                  {item.label}
                </StewieText>
              </TouchableOpacity>
            );
          }}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(135).duration(400)} style={styles.filtersRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { label: 'All', value: 'ALL' as const },
            { label: 'Settled', value: 'SETTLED' as const },
            { label: 'Pending', value: 'AUTHORIZED' as const },
            { label: 'Declined', value: 'DECLINED' as const },
          ]}
          keyExtractor={(item) => item.label}
          renderItem={({ item }) => {
            const isSelected = statusFilter === item.value;
            return (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStatusFilter(item.value);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected
                      ? StewiePayBrand.colors.primary
                      : StewiePayBrand.colors.surface,
                    borderColor: isSelected
                      ? StewiePayBrand.colors.primary
                      : StewiePayBrand.colors.surfaceVariant,
                  },
                ]}
              >
                <StewieText
                  variant="labelMedium"
                  color={isSelected ? 'primary' : 'secondary'}
                  weight={isSelected ? 'semibold' : 'regular'}
                >
                  {item.label}
                </StewieText>
              </TouchableOpacity>
            );
          }}
        />
      </Animated.View>

      {hasActiveFilters && (
        <View style={styles.clearFiltersRow}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSearchQuery('');
              setCategoryFilter(null);
              setStatusFilter('ALL');
              setDateRangeDays(null);
            }}
            style={styles.clearFiltersButton}
          >
            <Ionicons name="close-circle-outline" size={16} color={StewiePayBrand.colors.textMuted} />
            <StewieText variant="labelMedium" color="muted" style={{ marginLeft: 6 }}>
              Clear filters
            </StewieText>
          </TouchableOpacity>
        </View>
      )}

      {/* Category Filters */}
      {categories.length > 0 && (
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.filtersContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[null, ...categories]}
            keyExtractor={(item) => item || 'all'}
            renderItem={({ item }) => {
              const isSelected = categoryFilter === item;
              const category = item || 'All';
              return (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCategoryFilter(item);
                  }}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected
                        ? StewiePayBrand.colors.primary
                        : StewiePayBrand.colors.surface,
                      borderColor: isSelected
                        ? StewiePayBrand.colors.primary
                        : StewiePayBrand.colors.surfaceVariant,
                    },
                  ]}
                >
                  <StewieText
                    variant="labelMedium"
                    color={isSelected ? 'primary' : 'secondary'}
                    weight={isSelected ? 'semibold' : 'regular'}
                  >
                    {item ? `${getCategoryIcon(item)} ` : ''}
                    {category}
                  </StewieText>
                </TouchableOpacity>
              );
            }}
          />
        </Animated.View>
      )}

      {/* Transactions List */}
      {loading && txns.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.loadingContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={StewiePayBrand.colors.primary} />}
        >
          <View style={styles.header}>
            <SkeletonLoader width={200} height={32} borderRadius={8} />
            <SkeletonLoader width={150} height={16} borderRadius={8} style={{ marginTop: 8 }} />
          </View>
          <View style={styles.statsContainer}>
            {[1, 2].map((i) => (
              <SkeletonLoader key={i} width="48%" height={80} borderRadius={StewiePayBrand.radius.lg} />
            ))}
          </View>
          <SkeletonList count={5} />
        </ScrollView>
      ) : (
        <SectionList
          sections={groupedTransactions}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={StewiePayBrand.colors.primary} />}
          contentContainerStyle={txns.length === 0 ? styles.emptyContainer : styles.listContainer}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <StewieText variant="labelLarge" color="muted" weight="semibold">
                {title}
              </StewieText>
            </View>
          )}
          renderItem={({ item, index, section }) => (
            <Animated.View entering={FadeInDown.delay(200 + index * 30).duration(300)}>
              <TransactionItem
                transaction={item}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    navigation.navigate('TransactionDetail', { transaction: item });
                }}
              />
            </Animated.View>
          )}
          ListEmptyComponent={
            !loading ? (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyState}>
                <Ionicons name="list-outline" size={64} color={StewiePayBrand.colors.textMuted} style={{ marginBottom: StewiePayBrand.spacing.lg }} />
                <StewieText variant="titleLarge" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.sm }}>
                  {searchQuery || categoryFilter ? 'No transactions found' : 'No transactions yet'}
                </StewieText>
                <StewieText variant="bodyMedium" color="muted" style={{ textAlign: 'center', paddingHorizontal: StewiePayBrand.spacing.lg }}>
                  {hasActiveFilters
                    ? 'Try adjusting your search or filters'
                    : 'Your transactions will appear here once you start using your cards'}
                </StewieText>
              </Animated.View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Transparent to show FintechBackground
  },
  header: {
    paddingTop: 60,
    paddingBottom: StewiePayBrand.spacing.lg,
    paddingHorizontal: StewiePayBrand.spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: StewiePayBrand.spacing.sm,
    paddingHorizontal: StewiePayBrand.spacing.lg,
    marginBottom: StewiePayBrand.spacing.md,
  },
  statCard: {
    flex: 1,
    padding: StewiePayBrand.spacing.md,
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: StewiePayBrand.spacing.lg,
    paddingBottom: StewiePayBrand.spacing.sm,
  },
  filtersRow: {
    paddingHorizontal: StewiePayBrand.spacing.lg,
    paddingBottom: StewiePayBrand.spacing.xs,
  },
  clearFiltersRow: {
    paddingHorizontal: StewiePayBrand.spacing.lg,
    paddingBottom: StewiePayBrand.spacing.sm,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: StewiePayBrand.spacing.xs,
    paddingHorizontal: StewiePayBrand.spacing.sm,
    borderRadius: StewiePayBrand.radius.full,
    backgroundColor: StewiePayBrand.colors.surface,
    borderWidth: 1,
    borderColor: StewiePayBrand.colors.surfaceVariant,
  },
  searchCard: {
    padding: 0,
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: StewiePayBrand.spacing.md,
    paddingVertical: StewiePayBrand.spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: StewiePayBrand.spacing.sm,
    fontSize: StewiePayBrand.typography.styles.bodyMedium.fontSize,
    fontWeight: StewiePayBrand.typography.styles.bodyMedium.fontWeight as '400' | '500' | '600' | '700' | '800' | '900',
    lineHeight: StewiePayBrand.typography.styles.bodyMedium.lineHeight,
    letterSpacing: StewiePayBrand.typography.styles.bodyMedium.letterSpacing,
    color: StewiePayBrand.colors.textPrimary,
  },
  filtersContainer: {
    paddingVertical: StewiePayBrand.spacing.sm,
    paddingHorizontal: StewiePayBrand.spacing.lg,
  },
  filterChip: {
    paddingHorizontal: StewiePayBrand.spacing.md,
    paddingVertical: StewiePayBrand.spacing.sm,
    borderRadius: StewiePayBrand.radius.full,
    borderWidth: 1,
    marginRight: StewiePayBrand.spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'transparent', // Transparent to show FintechBackground
  },
  loadingContent: {
    padding: StewiePayBrand.spacing.lg,
    paddingTop: 80,
  },
  listContainer: {
    paddingTop: StewiePayBrand.spacing.sm,
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingHorizontal: StewiePayBrand.spacing.lg,
    paddingVertical: StewiePayBrand.spacing.md,
    paddingTop: StewiePayBrand.spacing.lg,
  },
  emptyContainer: {
    flexGrow: 1,
    padding: StewiePayBrand.spacing.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: StewiePayBrand.spacing['3xl'],
  },
  transactionCard: {
    marginBottom: StewiePayBrand.spacing.sm,
    marginHorizontal: StewiePayBrand.spacing.lg,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: StewiePayBrand.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: StewiePayBrand.spacing.md,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: StewiePayBrand.spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: StewiePayBrand.spacing.sm,
    marginTop: StewiePayBrand.spacing.xs,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: StewiePayBrand.spacing.sm,
    paddingVertical: 2,
    borderRadius: StewiePayBrand.radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: StewiePayBrand.spacing.xs,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
});

