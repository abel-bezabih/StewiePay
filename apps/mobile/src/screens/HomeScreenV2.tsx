// @ts-nocheck - Premium screen not in use, using react-native-paper which is not installed
import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, RefreshControl } from 'react-native';
// These imports are commented out as react-native-paper is not installed
// The screen is not currently used in navigation
/*
import {
  Surface,
  Text,
  Card,
  Button,
  Chip,
  Avatar,
  FAB,
  ProgressBar,
  Divider,
  IconButton
} from 'react-native-paper';
import { useTheme } from 'react-native-paper';
*/
import { useAuth } from '../contexts/AuthContext';
import { CardsAPI, AnalyticsAPI } from '../api/client';
import { PremiumCard } from '../components/PremiumCard';

export const HomeScreenV2 = ({ navigation }: any) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalSpend: 0,
    activeCards: 0,
    monthlySpend: 0,
    monthlyLimit: 50000
  });
  const [primaryCard, setPrimaryCard] = useState<any>(null);

  const loadData = async () => {
    try {
      const [cardsResp, analyticsResp] = await Promise.all([
        CardsAPI.list().catch(() => ({ data: [] })),
        AnalyticsAPI.spendByMonth().catch(() => ({ data: [] }))
      ]);

      const cards = cardsResp.data || [];
      setPrimaryCard(cards[0] || null);
      const monthlyData = analyticsResp.data?.[analyticsResp.data.length - 1];
      setStats({
        totalSpend: analyticsResp.data?.reduce((sum: number, m: any) => sum + (m.total || 0), 0) || 0,
        activeCards: cards.filter((c: any) => c.status === 'ACTIVE').length,
        monthlySpend: monthlyData?.total || 0,
        monthlyLimit: 50000
      });
    } catch (e) {
      console.error('Failed to load home data:', e);
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

  const spendPercentage = (stats.monthlySpend / stats.monthlyLimit) * 100;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.headerContent}>
            <View>
              <Text variant="headlineMedium" style={{ fontWeight: '800', color: theme.colors.onSurface }}>
                Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                Control your spend, one card at a time
              </Text>
            </View>
            <Avatar.Text size={48} label={user?.name?.charAt(0) || 'U'} />
          </View>
        </Surface>

        {/* Primary Card */}
        {primaryCard ? (
          <View style={styles.cardContainer}>
            <PremiumCard
              cardNumber={primaryCard.issuerCardId || '4242 4242 4242 4242'}
              cardholderName={user?.name || 'Cardholder'}
              type={primaryCard.type || 'PERMANENT'}
              status={primaryCard.status}
              onPress={() => navigation.navigate('CardDetail', { cardId: primaryCard.id })}
            />
          </View>
        ) : (
          <Card
            style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('CreateCard')}
          >
            <Card.Content style={styles.emptyCardContent}>
              <Text variant="displaySmall" style={{ marginBottom: 8 }}>💳</Text>
              <Text variant="titleLarge" style={{ marginBottom: 4 }}>
                No cards yet
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Create your first card to start controlling your spend
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Monthly Spend Progress */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.spendHeader}>
              <View>
                <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                  This Month
                </Text>
                <Text variant="headlineSmall" style={{ fontWeight: '700', marginTop: 4 }}>
                  ETB {stats.monthlySpend.toLocaleString()}
                </Text>
              </View>
              <Chip icon="trending-up" mode="flat" style={{ backgroundColor: theme.colors.primaryContainer }}>
                {stats.monthlyLimit.toLocaleString()} limit
              </Chip>
            </View>
            <ProgressBar
              progress={Math.min(spendPercentage / 100, 1)}
              color={spendPercentage > 80 ? theme.colors.error : theme.colors.primary}
              style={{ marginTop: 16, height: 8, borderRadius: 4 }}
            />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
              {spendPercentage.toFixed(1)}% of monthly limit used
            </Text>
          </Card.Content>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
                Active Cards
              </Text>
              <Text variant="headlineMedium" style={{ fontWeight: '700' }}>
                {stats.activeCards}
              </Text>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
                Total Spend
              </Text>
              <Text variant="headlineMedium" style={{ fontWeight: '700' }}>
                ETB {stats.totalSpend.toLocaleString()}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ fontWeight: '700', marginBottom: 16 }}>
              Quick Actions
            </Text>
            <View style={styles.actionsGrid}>
              <Button
                mode="contained-tonal"
                icon="credit-card-plus"
                onPress={() => navigation.navigate('CreateCard')}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
              >
                New Card
              </Button>
              <Button
                mode="contained-tonal"
                icon="chart-line"
                onPress={() => navigation.navigate('Transactions')}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
              >
                Analytics
              </Button>
            </View>
            <Divider style={{ marginVertical: 16 }} />
            <View style={styles.actionsGrid}>
              <Button
                mode="outlined"
                icon="wallet"
                onPress={() => navigation.navigate('TopUp')}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
              >
                Top Up
              </Button>
              <Button
                mode="outlined"
                icon="cog"
                onPress={() => {}}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
              >
                Settings
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* FAB */}
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
  cardContainer: {
    paddingHorizontal: 20,
    paddingTop: 20
  },
  emptyCard: {
    margin: 20,
    borderStyle: 'dashed',
    borderWidth: 2
  },
  emptyCardContent: {
    alignItems: 'center',
    paddingVertical: 40
  },
  card: {
    margin: 20,
    marginTop: 10
  },
  spendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 10
  },
  statCard: {
    flex: 1
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12
  },
  actionButton: {
    flex: 1
  },
  actionButtonContent: {
    paddingVertical: 8
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0
  }
});






