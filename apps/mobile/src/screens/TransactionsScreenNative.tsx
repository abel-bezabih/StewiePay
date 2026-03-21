// @ts-nocheck - NativeWind not configured, className props replaced with styles
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { TransactionsAPI } from '../api/client';
import { getCategoryIcon, getCategoryColor } from '../utils/category-utils';
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
        <Text style={styles.iconText}>{categoryIcon}</Text>
      </View>

      {/* Merchant Info */}
      <View style={styles.merchantInfo}>
        <Text style={styles.merchantName} numberOfLines={1}>
          {transaction.merchantName || 'Unknown Merchant'}
        </Text>
        <Text style={styles.dateText}>{formatDate(transaction.createdAt)}</Text>
      </View>

      {/* Amount */}
      <View style={styles.amountContainer}>
        <Text
          style={[styles.amountText, { color: isNegative ? '#FFFFFF' : '#00D9FF' }]}
        >
          {isNegative ? '-' : '+'}ETB {amount.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const TransactionsScreenNative = ({ navigation, route }: any) => {
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
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search transactions..."
            placeholderTextColor="#666666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Transactions List */}
      {loading && txns.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={32} color="#667EEA" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : (
        <FlatList
          data={txns}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#667EEA" />}
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
                <Text style={styles.emptyText}>
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
    backgroundColor: '#0A0A0A', // Darker than cards but not pure black
  },
  header: {
    paddingTop: 64,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBox: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
  },
  searchInput: {
    color: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#CCCCCC',
    marginTop: 16,
  },
  listContainer: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  emptyContainer: {
    flexGrow: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: '#999999',
    fontSize: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateText: {
    color: '#999999',
    fontSize: 14,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
