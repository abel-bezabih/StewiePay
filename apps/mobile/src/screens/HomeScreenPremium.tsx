// @ts-nocheck - Premium screen not in use, using react-native-paper which is not installed
import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, RefreshControl, Dimensions } from 'react-native';
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
  ProgressBar,
  ActivityIndicator
} from 'react-native-paper';
import { useTheme } from 'react-native-paper';
*/
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { LineChart } from 'react-native-chart-kit';
import { useAuth } from '../contexts/AuthContext';
import { CardsAPI, AnalyticsAPI } from '../api/client';
import { PremiumCardV2 } from '../components/PremiumCardV2';
import { InteractiveCard } from '../components/InteractiveCard';
import { EnhancedAnimatedCounter } from '../components/EnhancedAnimatedCounter';
import { GlassmorphicCard } from '../components/GlassmorphicCard';
import { ProgressRing } from '../components/ProgressRing';
import { CardStack } from '../components/CardStack';
import { SharedElement } from '../components/SharedElement';

const { width } = Dimensions.get('window');

export const HomeScreenPremium = ({ navigation }: any) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSpend: 0,
    activeCards: 0,
    monthlySpend: 0,
    monthlyLimit: 50000,
    weeklySpend: [0, 0, 0, 0, 0, 0, 0]
  });
  const [primaryCard, setPrimaryCard] = useState<any>(null);
  const [allCards, setAllCards] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [cardsResp, analyticsResp] = await Promise.all([
        CardsAPI.list().catch(() => ({ data: [] })),
        AnalyticsAPI.spendByMonth().catch(() => ({ data: [] }))
      ]);

      const cards = cardsResp.data || [];
      setAllCards(cards);
      setPrimaryCard(cards[0] || null);
      const monthlyData = analyticsResp.data?.[analyticsResp.data.length - 1];
      
      // Mock weekly data for chart
      const weeklyData = [1200, 1800, 1500, 2200, 1900, 2500, 2100];
      
      setStats({
        totalSpend: analyticsResp.data?.reduce((sum: number, m: any) => sum + (m.total || 0), 0) || 0,
        activeCards: cards.filter((c: any) => c.status === 'ACTIVE').length,
        monthlySpend: monthlyData?.total || 0,
        monthlyLimit: 50000,
        weeklySpend: weeklyData
      });
    } catch (e) {
      console.error('Failed to load home data:', e);
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

  const spendPercentage = (stats.monthlySpend / stats.monthlyLimit) * 100;
  const chartData = stats.weeklySpend.map((value, index) => ({ x: index + 1, y: value }));

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Revolut-Style Header - Clean, Minimal, Pure Black */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Animatable.View animation="fadeInDown" duration={600}>
              <Text variant="headlineLarge" style={styles.headerTitle}>
                {user?.name ? user.name.split(' ')[0] : 'Welcome'}
              </Text>
            </Animatable.View>
            <IconButton
              icon="bell-outline"
              iconColor={theme.colors.onSurface}
              size={24}
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Premium Card Stack - Revolut-style */}
        {allCards.length > 0 ? (
          <SharedElement id="primary-card" animated={true}>
            <CardStack
              cards={allCards.slice(0, 3).map((card) => ({
                id: card.id,
                cardNumber: card.issuerCardId || '4242 4242 4242 4242',
                cardholderName: user?.name || 'Cardholder',
                type: card.type || 'PERMANENT',
                status: card.status,
                balance: 10000,
                currency: 'ETB'
              }))}
              onCardPress={(cardId) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('CardDetail', { cardId });
              }}
              onCardSwipe={(cardId, direction) => {
                if (direction === 'right') {
                  navigation.navigate('CardDetail', { cardId });
                }
              }}
            />
          </SharedElement>
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
                Create your first card to start
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Monthly Spend Progress - Revolutionary Glassmorphic Card */}
        <Animatable.View animation="fadeInUp" delay={300} duration={600}>
          <GlassmorphicCard
            intensity={30}
            onPress={() => navigation.navigate('Analytics')}
          >
            <View style={styles.spendHeader}>
              <View style={{ flex: 1 }}>
                <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
                  This Month
                </Text>
                  <EnhancedAnimatedCounter
                    value={stats.monthlySpend}
                    prefix="ETB "
                    useSpring={true}
                    format="currency"
                    currency="ETB"
                    style={{ fontSize: 28 }}
                  />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
                  <ProgressRing
                    progress={Math.min(spendPercentage / 100, 1)}
                    size={60}
                    strokeWidth={6}
                    color={spendPercentage > 80 ? theme.colors.error : theme.colors.primary}
                    animated={true}
                  />
                  <View style={{ marginLeft: 16, flex: 1 }}>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {spendPercentage.toFixed(1)}% used
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                      {((stats.monthlyLimit - stats.monthlySpend) / 1000).toFixed(0)}k remaining
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </GlassmorphicCard>
        </Animatable.View>

        {/* Weekly Spend Chart */}
        <Animatable.View animation="fadeInUp" delay={400} duration={600}>
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="titleLarge" style={{ fontWeight: '700', marginBottom: 16 }}>
                Weekly Spending
              </Text>
              <View style={styles.chartContainer}>
                <LineChart
                  data={{
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                      {
                        data: stats.weeklySpend,
                        color: (opacity = 1) => theme.colors.primary,
                        strokeWidth: 3
                      }
                    ]
                  }}
                  width={width - 80}
                  height={200}
                  chartConfig={{
                    backgroundColor: theme.colors.surface,
                    backgroundGradientFrom: theme.colors.surface,
                    backgroundGradientTo: theme.colors.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) => theme.colors.primary,
                    labelColor: (opacity = 1) => theme.colors.onSurfaceVariant,
                    style: {
                      borderRadius: 16
                    },
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: theme.colors.primary
                    }
                  }}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16
                  }}
                />
              </View>
            </Card.Content>
          </Card>
        </Animatable.View>

        {/* Stats Grid - Revolut Style: Clean, Minimal */}
        <Animatable.View animation="fadeInUp" delay={500} duration={600}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
                Active Cards
              </Text>
              <EnhancedAnimatedCounter
                value={stats.activeCards}
                useSpring={true}
                style={{ fontSize: 28, fontWeight: '700' }}
              />
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
                Total Spend
              </Text>
              <EnhancedAnimatedCounter
                value={stats.totalSpend}
                prefix="ETB "
                useSpring={true}
                format="currency"
                currency="ETB"
                style={{ fontSize: 28, fontWeight: '700' }}
              />
            </View>
          </View>
        </Animatable.View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: '#0A0A0A' // Darker than cards but not pure black
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 32 // Larger like Revolut
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
    marginTop: 10,
    elevation: 4
  },
  spendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 8
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 10,
    marginBottom: 20
  },
  spendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#1A1A1A' // Dark gray like Revolut
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0
  }
});

