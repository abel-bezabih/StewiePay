import React, { useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { StatCard } from '../components/StatCard';
import { PremiumCard } from '../components/PremiumCard';
import { useTheme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { CardsAPI, AnalyticsAPI } from '../api/client';

export const HomeScreen = ({ navigation }: any) => {
  const { spacing } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalSpend: 0,
    activeCards: 0,
    monthlySpend: 0,
    upcomingCharges: 0
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
      setStats({
        totalSpend: analyticsResp.data?.reduce((sum: number, m: any) => sum + (m.total || 0), 0) || 0,
        activeCards: cards.filter((c: any) => c.status === 'ACTIVE').length,
        monthlySpend: analyticsResp.data?.[analyticsResp.data.length - 1]?.total || 0,
        upcomingCharges: 0 // TODO: wire to subscriptions
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

  return (
    <Screen>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={{ marginBottom: spacing(4) }}>
          <Text variant="title" style={{ fontSize: 32, fontWeight: '800' }}>
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </Text>
          <Text variant="muted" style={{ marginTop: spacing(1), fontSize: 16 }}>
            Control your spend, one card at a time
          </Text>
        </View>

        {/* Primary Card */}
        {primaryCard ? (
          <PremiumCard
            cardNumber={primaryCard.issuerCardId || '4242 4242 4242 4242'}
            cardholderName={user?.name || 'Cardholder'}
            type={primaryCard.type || 'PERMANENT'}
            status={primaryCard.status}
            onPress={() => navigation.navigate('CardDetail', { cardId: primaryCard.id })}
          />
        ) : (
          <View
            style={{
              backgroundColor: '#111827',
              borderRadius: 20,
              padding: spacing(6),
              alignItems: 'center',
              marginBottom: spacing(4),
              borderWidth: 2,
              borderColor: '#1F2937',
              borderStyle: 'dashed'
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: spacing(2) }}>💳</Text>
            <Text variant="subtitle" style={{ marginBottom: spacing(1) }}>
              No cards yet
            </Text>
            <Text variant="muted" style={{ textAlign: 'center', marginBottom: spacing(4) }}>
              Create your first card to start controlling your spend
            </Text>
          </View>
        )}

        {/* Stats Grid */}
        <View style={[styles.statsGrid, { marginTop: spacing(4), gap: spacing(3) }]}>
          <StatCard
            label="This Month"
            value={`ETB ${stats.monthlySpend.toLocaleString()}`}
            icon="📊"
            trend={{ value: 12, isPositive: false }}
          />
          <StatCard
            label="Active Cards"
            value={stats.activeCards}
            icon="💳"
          />
        </View>

        <View style={[styles.statsGrid, { marginTop: spacing(3), gap: spacing(3) }]}>
          <StatCard
            label="Total Spend"
            value={`ETB ${stats.totalSpend.toLocaleString()}`}
            icon="💰"
          />
          <StatCard
            label="Upcoming"
            value={stats.upcomingCharges}
            icon="📅"
          />
        </View>

        {/* Quick Actions */}
        <View style={{ marginTop: spacing(6), marginBottom: spacing(4) }}>
          <Text variant="subtitle" style={{ marginBottom: spacing(3), fontSize: 18 }}>
            Quick Actions
          </Text>
          <View style={{ gap: spacing(2) }}>
            <QuickActionButton
              icon="➕"
              label="Create New Card"
              onPress={() => navigation.navigate('Cards')}
            />
            <QuickActionButton
              icon="📈"
              label="View Analytics"
              onPress={() => navigation.navigate('Transactions')}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
};

const QuickActionButton = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => {
  const { colors, spacing, radius } = useTheme();
  const { TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: radius.md,
        padding: spacing(4),
        borderWidth: 1,
        borderColor: colors.border
      }}
    >
      <Text style={{ fontSize: 24, marginRight: spacing(3) }}>{icon}</Text>
      <Text variant="subtitle" style={{ flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 18, color: colors.muted }}>→</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row'
  }
});
