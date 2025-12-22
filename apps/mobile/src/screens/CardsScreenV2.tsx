// @ts-nocheck - Premium screen not in use, using react-native-paper which is not installed
import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
// These imports are commented out as react-native-paper is not installed
// The screen is not currently used in navigation
/*
import {
  Surface,
  Text,
  Card,
  FAB,
  Chip,
  IconButton,
  Divider,
  ActivityIndicator
} from 'react-native-paper';
import { useTheme } from 'react-native-paper';
*/
import { useAuth } from '../contexts/AuthContext';
import { CardsAPI } from '../api/client';
import { PremiumCard } from '../components/PremiumCard';
import { EmptyState } from '../components/EmptyState';

export const CardsScreenV2 = ({ navigation }: any) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await CardsAPI.list();
      setCards(resp.data || []);
    } catch (e) {
      console.error('Failed to load cards:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation]);

  const getStatusChip = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
      ACTIVE: { label: 'Active', color: theme.colors.primaryContainer, icon: '✓' },
      FROZEN: { label: 'Frozen', color: theme.colors.errorContainer, icon: '❄️' },
      CLOSED: { label: 'Closed', color: theme.colors.surfaceVariant, icon: '🔒' }
    };
    const config = statusConfig[status] || statusConfig.ACTIVE;
    return (
      <Chip
        icon={() => <Text>{config.icon}</Text>}
        mode="flat"
        style={{ backgroundColor: config.color }}
        textStyle={{ fontSize: 12 }}
      >
        {config.label}
      </Chip>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerContent}>
          <View>
            <Text variant="headlineMedium" style={{ fontWeight: '800', color: theme.colors.onSurface }}>
              Your Cards
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              {cards.length} {cards.length === 1 ? 'card' : 'cards'}
            </Text>
          </View>
          <IconButton
            icon="plus"
            size={28}
            iconColor={theme.colors.primary}
            onPress={() => navigation.navigate('CreateCard')}
            style={{ backgroundColor: theme.colors.primaryContainer }}
          />
        </View>
      </Surface>

      {loading && cards.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          contentContainerStyle={cards.length === 0 ? styles.emptyContainer : styles.listContainer}
          renderItem={({ item }) => (
            <Card
              style={[styles.cardItem, { backgroundColor: theme.colors.surface }]}
              onPress={() => navigation.navigate('CardDetail', { cardId: item.id })}
            >
              <Card.Content>
                <PremiumCard
                  cardNumber={item.issuerCardId || '4242 4242 4242 4242'}
                  cardholderName={user?.name || 'Cardholder'}
                  type={item.type || 'PERMANENT'}
                  status={item.status}
                />
                <Divider style={{ marginVertical: 16 }} />
                <View style={styles.cardFooter}>
                  <View style={styles.cardInfo}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Type
                    </Text>
                    <Text variant="bodyMedium" style={{ fontWeight: '600', marginTop: 4 }}>
                      {item.type?.replace('_', ' ') || 'Permanent'}
                    </Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Status
                    </Text>
                    <View style={{ marginTop: 4 }}>{getStatusChip(item.status)}</View>
                  </View>
                  {item.limitMonthly && (
                    <View style={styles.cardInfo}>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Monthly Limit
                      </Text>
                      <Text variant="bodyMedium" style={{ fontWeight: '600', marginTop: 4 }}>
                        ETB {item.limitMonthly.toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>
              </Card.Content>
            </Card>
          )}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                icon="💳"
                title="No cards yet"
                subtitle="Create your first card to start controlling your spend with limits, merchant locks, and more."
                actionLabel="Create Card"
                onAction={() => navigation.navigate('CreateCard')}
              />
            ) : null
          }
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('CreateCard')}
        label="New Card"
      />
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContainer: {
    padding: 20,
    paddingTop: 20
  },
  emptyContainer: {
    flexGrow: 1,
    padding: 20
  },
  cardItem: {
    marginBottom: 16,
    elevation: 2
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  cardInfo: {
    flex: 1,
    minWidth: '45%'
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0
  }
});






