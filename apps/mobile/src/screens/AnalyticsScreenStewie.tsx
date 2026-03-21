import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { PieChart } from 'react-native-chart-kit';
import { AnalyticsAPI } from '../api/client';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieCard } from '../components/stewiepay/StewieCard';
import { StewieText } from '../components/stewiepay/StewieText';
import { GlassCard } from '../components/modern/GlassCard';
import { SkeletonLoader, SkeletonCard } from '../components/modern/SkeletonLoader';
import { getCategoryIcon, getCategoryColor } from '../utils/category-utils';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 40;

export const AnalyticsScreenStewie = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [categoryResp, monthlyResp] = await Promise.all([
        AnalyticsAPI.spendByCategory().catch(() => ({ data: [] })),
        AnalyticsAPI.spendByMonth().catch(() => ({ data: [] })),
      ]);

      setCategoryData(categoryResp.data || []);
      setMonthlyData(monthlyResp.data || []);
    } catch (e) {
      console.error('Failed to load analytics:', e);
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

  if (loading) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.loadingContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={StewiePayBrand.colors.primary} />}
        >
          <View style={styles.header}>
            <SkeletonLoader width={200} height={32} borderRadius={8} />
            <SkeletonLoader width={250} height={16} borderRadius={8} style={{ marginTop: 8 }} />
          </View>
          <View style={styles.insightsContainer}>
            {[1, 2, 3].map((i) => (
              <SkeletonLoader key={i} width="30%" height={120} borderRadius={StewiePayBrand.radius.xl} />
            ))}
          </View>
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      </View>
    );
  }

  const hasData = categoryData.length > 0;
  const latestMonth = monthlyData[monthlyData.length - 1];
  const latestSpend = latestMonth?.total || 0;

  // Prepare pie chart data
  const pieData = categoryData.slice(0, 6).map((item) => ({
    name: item.category,
    amount: item.amount,
    color: getCategoryColor(item.category),
    legendFontColor: StewiePayBrand.colors.textPrimary,
    legendFontSize: 12,
  }));

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={StewiePayBrand.colors.primary} />}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces={true}
      >
        {/* StewiePay Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <StewieText variant="headlineLarge" color="primary" weight="black" style={{ color: StewiePayBrand.colors.primary }}>
            Analytics
          </StewieText>
          <StewieText variant="bodyMedium" color="muted" style={{ marginTop: StewiePayBrand.spacing.xs }}>
            Insights into your spending patterns
          </StewieText>
        </Animated.View>

        {!hasData ? (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyContainer}>
            <Ionicons name="stats-chart-outline" size={64} color={StewiePayBrand.colors.textMuted} style={{ marginBottom: StewiePayBrand.spacing.lg }} />
            <StewieText variant="titleLarge" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.sm }}>
              No Analytics Yet
            </StewieText>
            <StewieText variant="bodyMedium" color="muted" style={{ textAlign: 'center', paddingHorizontal: StewiePayBrand.spacing.lg }}>
              Start making transactions to see your spending insights
            </StewieText>
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.insightsContainer}>
              <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                <GlassCard elevated intensity={35} style={styles.insightCard}>
                  <StewieText variant="labelMedium" color="muted" style={{ marginBottom: StewiePayBrand.spacing.sm }}>
                    Latest Month Spend
                  </StewieText>
                  <StewieText variant="displaySmall" color="primary" weight="black" style={{ marginBottom: StewiePayBrand.spacing.xs }}>
                    ETB {latestSpend?.toLocaleString() || '0'}
                  </StewieText>
                  {latestMonth?.month && latestMonth?.year && (
                    <StewieText variant="bodySmall" color="muted">
                      {latestMonth.month}/{latestMonth.year}
                    </StewieText>
                  )}
                </GlassCard>
              </Animated.View>
            </Animated.View>

            {/* Category Breakdown */}
            {categoryData.length > 0 && (
              <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.section}>
                <GlassCard elevated intensity={35}>
                  <StewieText variant="titleLarge" color="primary" weight="bold" style={styles.sectionTitle}>
                    Spending by Category
                  </StewieText>

                  {/* Pie Chart */}
                  {pieData.length > 0 && (
                    <View style={styles.chartContainer}>
                      <PieChart
                        data={pieData}
                        width={CHART_WIDTH}
                        height={220}
                        chartConfig={{
                          backgroundColor: StewiePayBrand.colors.surface,
                          backgroundGradientFrom: StewiePayBrand.colors.surface,
                          backgroundGradientTo: StewiePayBrand.colors.surface,
                          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        }}
                        accessor="amount"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        absolute
                      />
                    </View>
                  )}

                  {/* Category List */}
                  <View style={styles.categoryList}>
                    {categoryData.map((item, index) => (
                      <Animated.View
                        key={item.category || 'Other'}
                        entering={FadeInDown.delay(300 + index * 30).duration(300)}
                      >
                        <TouchableOpacity style={styles.categoryItem}>
                          <View style={styles.categoryItemLeft}>
                            <View
                              style={[
                                styles.categoryIcon,
                                { backgroundColor: `${getCategoryColor(item.category)}20` },
                              ]}
                            >
                              <Ionicons
                                name={getCategoryIcon(item.category) as keyof typeof Ionicons.glyphMap}
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
            )}

          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Transparent to show FintechBackground
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'transparent', // Transparent to show FintechBackground
  },
  loadingContent: {
    padding: StewiePayBrand.spacing.lg,
    paddingTop: 130, // Even more space below back button
  },
  header: {
    paddingTop: 110, // Even more space below back button
    paddingBottom: StewiePayBrand.spacing.md,
    paddingHorizontal: StewiePayBrand.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: StewiePayBrand.spacing['3xl'],
    paddingHorizontal: StewiePayBrand.spacing.lg,
  },
  insightsContainer: {
    flexDirection: 'row',
    paddingHorizontal: StewiePayBrand.spacing.md,
    gap: StewiePayBrand.spacing.sm,
    marginBottom: StewiePayBrand.spacing.md,
  },
  insightCard: {
    flex: 1,
    padding: StewiePayBrand.spacing.md,
  },
  section: {
    paddingHorizontal: StewiePayBrand.spacing.md,
    marginBottom: StewiePayBrand.spacing.md,
  },
  sectionTitle: {
    marginBottom: StewiePayBrand.spacing.lg,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: StewiePayBrand.spacing.sm,
  },
  categoryList: {
    marginTop: StewiePayBrand.spacing.lg,
    gap: StewiePayBrand.spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: StewiePayBrand.colors.surfaceElevated,
    padding: StewiePayBrand.spacing.md,
    borderRadius: StewiePayBrand.radius.md,
    marginBottom: StewiePayBrand.spacing.sm,
  },
  categoryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: StewiePayBrand.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: StewiePayBrand.spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
});

