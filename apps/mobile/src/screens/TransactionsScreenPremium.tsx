// @ts-nocheck - Premium screen not in use, using react-native-paper which is not installed
import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
// These imports are commented out as react-native-paper is not installed
// The screen is not currently used in navigation
/*
import {
  Surface,
  Text,
  Card,
  Chip,
  ActivityIndicator,
  Divider,
  Searchbar,
  IconButton,
  Menu,
  Portal,
  Dialog,
  Button,
  TextInput
} from 'react-native-paper';
import { useTheme } from 'react-native-paper';
*/
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import { TransactionsAPI } from '../api/client';
import { EmptyState } from '../components/EmptyState';
import { getCategoryIcon, getCategoryColor } from '../utils/category-utils';
import { BrandHeader } from '../components/BrandHeader';
import { TransactionCard } from '../components/TransactionCard';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { GlassmorphicCard } from '../components/GlassmorphicCard';
import { SharedElement } from '../components/SharedElement';

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

export const TransactionsScreenPremium = ({ navigation, route }: any) => {
  const theme = useTheme();
  const cardId = route?.params?.cardId;
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [filterDialogVisible, setFilterDialogVisible] = useState(false);
  const [filters, setFilters] = useState<{
    category?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: string;
    maxAmount?: string;
  }>({});

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (categoryFilter) params.category = categoryFilter;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.minAmount) params.minAmount = parseInt(filters.minAmount);
      if (filters.maxAmount) params.maxAmount = parseInt(filters.maxAmount);

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
  }, [navigation, cardId, searchQuery, categoryFilter, filters]);

  const categories = Array.from(new Set(txns.map((t) => t.category).filter(Boolean)));
  const hasActiveFilters = categoryFilter || searchQuery || filters.startDate || filters.endDate || filters.minAmount || filters.maxAmount;

  const clearFilters = () => {
    setCategoryFilter(null);
    setSearchQuery('');
    setFilters({});
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getStatusChip = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      AUTHORIZED: { label: 'Pending', color: theme.colors.primaryContainer },
      SETTLED: { label: 'Completed', color: theme.colors.primaryContainer },
      DECLINED: { label: 'Declined', color: theme.colors.errorContainer }
    };
    const config = statusConfig[status] || statusConfig.AUTHORIZED;
    return (
      <Chip
        mode="flat"
        style={{ backgroundColor: config.color }}
        textStyle={{ fontSize: 10 }}
      >
        {config.label}
      </Chip>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      {/* Revolut-Style Header - Clean, Minimal */}
      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.headerTitle}>
          Transactions
        </Text>
      </View>
      
      {/* Filter Menu */}
      <View style={styles.filterMenuContainer}>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="filter"
              iconColor={hasActiveFilters ? StewiePayBrand.colors.primary : StewiePayBrand.colors.onSurfaceVariant}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMenuVisible(true);
              }}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              setFilterDialogVisible(true);
            }}
            title="Advanced Filters"
          />
          {hasActiveFilters && (
            <>
              <Divider />
              <Menu.Item onPress={clearFilters} title="Clear All Filters" />
            </>
          )}
        </Menu>
      </View>

      {/* Revolut-Style Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchCard}>
          <Searchbar
            placeholder="Search transactions..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchbar, { backgroundColor: '#1A1A1A' }]}
            inputStyle={{ 
              color: '#FFFFFF',
              fontFamily: undefined
            }}
            iconColor="#999999"
            placeholderTextColor="#666666"
          />
        </View>
      </View>

      {/* Category Filters */}
      {categories.length > 0 && (
        <View style={styles.filters}>
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
                        ? StewiePayBrand.colors.primaryContainer
                        : StewiePayBrand.colors.surfaceVariant
                    }
                  ]}
                >
                  <Text
                    style={{
                      color: isSelected
                        ? StewiePayBrand.colors.onPrimaryContainer
                        : StewiePayBrand.colors.onSurfaceVariant,
                      fontWeight: isSelected ? '700' : '500'
                    }}
                  >
                    {item ? getCategoryIcon(item) + ' ' : ''}
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {loading && txns.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={32} color={StewiePayBrand.colors.primary} />
          <Text variant="bodyMedium" style={{ color: StewiePayBrand.colors.onSurfaceVariant, marginTop: 16 }}>
            Loading transactions...
          </Text>
        </View>
      ) : (
        <FlatList
          data={txns}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          contentContainerStyle={txns.length === 0 ? styles.emptyContainer : styles.listContainer}
          renderItem={({ item, index }) => (
            <SharedElement id={`transaction-${item.id}`} animated={true}>
              <TransactionCard
                transaction={item}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  // Navigate to transaction detail
                }}
                onSwipeRight={() => {
                  // View transaction details
                  console.log('View transaction:', item.id);
                }}
              />
            </SharedElement>
          )}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                icon="📊"
                title={hasActiveFilters ? 'No transactions found' : 'No transactions yet'}
                subtitle={
                  hasActiveFilters
                    ? 'Try adjusting your search or filters'
                    : 'Your transactions will appear here once you start using your cards'
                }
                actionLabel={hasActiveFilters ? 'Clear Filters' : undefined}
                onAction={hasActiveFilters ? clearFilters : undefined}
              />
            ) : null
          }
        />
      )}

      {/* Advanced Filters Dialog */}
      <Portal>
        <Dialog
          visible={filterDialogVisible}
          onDismiss={() => setFilterDialogVisible(false)}
          style={{ backgroundColor: StewiePayBrand.colors.surface }}
        >
          <Dialog.Title>Advanced Filters</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Start Date (YYYY-MM-DD)"
              value={filters.startDate || ''}
              onChangeText={(text: string) => setFilters({ ...filters, startDate: text })}
              mode="outlined"
              style={styles.dialogInput}
              placeholder="2024-01-01"
              contentStyle={{ fontFamily: undefined }}
            />
            <TextInput
              label="End Date (YYYY-MM-DD)"
              value={filters.endDate || ''}
              onChangeText={(text: string) => setFilters({ ...filters, endDate: text })}
              mode="outlined"
              style={styles.dialogInput}
              placeholder="2024-12-31"
              contentStyle={{ fontFamily: undefined }}
            />
            <TextInput
              label="Min Amount (ETB)"
              value={filters.minAmount || ''}
              onChangeText={(text: string) => setFilters({ ...filters, minAmount: text })}
              mode="outlined"
              keyboardType="numeric"
              style={styles.dialogInput}
              contentStyle={{ fontFamily: undefined }}
            />
            <TextInput
              label="Max Amount (ETB)"
              value={filters.maxAmount || ''}
              onChangeText={(text: string) => setFilters({ ...filters, maxAmount: text })}
              mode="outlined"
              keyboardType="numeric"
              style={styles.dialogInput}
              contentStyle={{ fontFamily: undefined }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setFilterDialogVisible(false)}>Cancel</Button>
            <Button onPress={() => {
              setFilterDialogVisible(false);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}>Apply</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A' // Darker than cards but not pure black // Pure black
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#0A0A0A' // Darker than cards but not pure black
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 32
  },
  filterMenuContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1000
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12
  },
  searchCard: {
    borderRadius: 16,
    backgroundColor: '#1A1A1A' // Dark gray
  },
  searchbar: {
    elevation: 0,
    backgroundColor: 'transparent'
  },
  filters: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#0A0A0A' // Darker than cards but not pure black
  },
  dialogInput: {
    marginBottom: 8
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContainer: {
    padding: 20,
    paddingTop: 8
  },
  emptyContainer: {
    flexGrow: 1,
    padding: 20
  },
  transactionCard: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 16
  },
  cardContent: {
    padding: 16
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconContainer: {
    marginRight: 12
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconText: {
    fontSize: 24
  },
  transactionInfo: {
    flex: 1
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  amountContainer: {
    alignItems: 'flex-end'
  }
});

