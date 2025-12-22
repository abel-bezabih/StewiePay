import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { TransactionsAPI } from '../api/client';
import { getCategoryIcon, getCategoryColor } from '../utils/category-utils';
import { colors, spacing, radius, typography, fontWeight } from '../styles/design-system';
import * as Haptics from 'expo-haptics';

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

interface TransactionCardProps {
  transaction: any;
  onPress?: () => void;
}

const TransactionCard = ({ transaction, onPress }: TransactionCardProps) => {
  const categoryIcon = getCategoryIcon(transaction.category);
  const categoryColor = getCategoryColor(transaction.category);
  const isNegative = transaction.amount < 0;
  const amount = Math.abs(transaction.amount);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.card}
    >
      {/* Category Icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}20` }]}>
        <Text style={styles.icon}>{categoryIcon}</Text>
      </View>

      {/* Merchant Info */}
      <View style={styles.merchantInfo}>
        <Text style={styles.merchant} numberOfLines={1}>
          {transaction.merchantName || 'Unknown Merchant'}
        </Text>
        <Text style={styles.date}>{formatDate(transaction.createdAt)}</Text>
      </View>

      {/* Amount */}
      <View style={styles.amountContainer}>
        <Text
          style={[styles.amount, { color: isNegative ? colors.text.primary : colors.brand.secondary }]}
        >
          {isNegative ? '-' : '+'}ETB {amount.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const TransactionsScreenClean = ({ navigation, route }: any) => {
  const cardId = route?.params?.cardId;
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      const resp = await TransactionsAPI.list(cardId, params);
      setTxns(resp.data || []);
    } catch (e) {
      console.error('Failed to load transactions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, cardId, searchQuery]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchCard}>
          <TextInput
            placeholder="Search transactions..."
            placeholderTextColor={colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Transactions List */}
      {loading && txns.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : (
        <FlatList
          data={txns}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.brand.primary} />}
          contentContainerStyle={txns.length === 0 ? styles.emptyContainer : styles.listContainer}
          renderItem={({ item }) => (
            <TransactionCard
              transaction={item}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                // Navigate to transaction detail
              }}
            />
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📊</Text>
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'No transactions found' : 'No transactions yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? 'Try adjusting your search'
                    : 'Your transactions will appear here once you start using your cards'}
                </Text>
              </View>
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
    backgroundColor: colors.bg.primary,
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  headerTitle: {
    ...typography['4xl'],
    color: colors.text.primary,
    fontWeight: fontWeight.black,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchCard: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.xl,
  },
  searchInput: {
    ...typography.base,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.base,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  listContainer: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  emptyContainer: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  icon: {
    fontSize: 22,
  },
  merchantInfo: {
    flex: 1,
  },
  merchant: {
    ...typography.base,
    color: colors.text.primary,
    fontWeight: fontWeight.semibold,
    marginBottom: 4,
  },
  date: {
    ...typography.sm,
    color: colors.text.muted,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.lg,
    fontWeight: fontWeight.bold,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.xl,
    color: colors.text.primary,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.base,
    color: colors.text.muted,
    textAlign: 'center',
  },
});





