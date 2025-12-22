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
import { PieChart, BarChart } from 'react-native-chart-kit';
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
  const [insights, setInsights] = useState<any>(null);
  const [topCategories, setTopCategories] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [categoryResp, insightsResp, topResp] = await Promise.all([
        AnalyticsAPI.spendByCategory().catch(() => ({ data: [] })),
        AnalyticsAPI.insights().catch(() => ({ data: null })),
        AnalyticsAPI.topCategories(5).catch(() => ({ data: [] })),
      ]);

      setCategoryData(categoryResp.data || []);
      setInsights(insightsResp.data);
      setTopCategories(topResp.data || []);
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

  // Prepare pie chart data
  const pieData = categoryData.slice(0, 6).map((item) => ({
    name: item.category,
    amount: item.amount,
    color: getCategoryColor(item.category),
    legendFontColor: StewiePayBrand.colors.textPrimary,
    legendFontSize: 12,
  }));

  // Prepare bar chart data - use category names instead of icons for chart labels
  const barData = {
    labels: topCategories.slice(0, 5).map((c) => c.category?.slice(0, 8) || 'Other'),
    datasets: [
      {
        data: topCategories.slice(0, 5).map((c) => c.amount),
      },
    ],
  };

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
          <StewieText variant="headlineLarge" color="primary" weight="black">
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
            {/* Insights Cards */}
            {insights && (
              <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.insightsContainer}>
                <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                  <GlassCard elevated intensity={35} style={styles.insightCard}>
                    <StewieText variant="labelMedium" color="muted" style={{ marginBottom: StewiePayBrand.spacing.sm }}>
                      Total Spend
                    </StewieText>
                    <StewieText variant="displaySmall" color="primary" weight="black" style={{ marginBottom: StewiePayBrand.spacing.xs }}>
                      ETB {insights.totalSpend?.toLocaleString() || '0'}
                    </StewieText>
                    <StewieText variant="bodySmall" color="muted">
                      {insights.totalTransactions || 0} transactions
                    </StewieText>
                  </GlassCard>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(150).duration(400)}>
                  <GlassCard elevated intensity={35} style={styles.insightCard}>
                    <StewieText variant="labelMedium" color="muted" style={{ marginBottom: StewiePayBrand.spacing.sm }}>
                      This Month
                    </StewieText>
                    <StewieText variant="displaySmall" color="primary" weight="black" style={{ marginBottom: StewiePayBrand.spacing.xs }}>
                      ETB {insights.monthlySpend?.toLocaleString() || '0'}
                    </StewieText>
                    {insights.monthlyChange !== 0 && (
                      <View style={styles.changeRow}>
                        <StewieText
                          variant="bodySmall"
                          style={{
                            color: insights.monthlyChange > 0 ? StewiePayBrand.colors.error : StewiePayBrand.colors.secondary,
                            marginTop: StewiePayBrand.spacing.xs,
                          }}
                        >
                          {insights.monthlyChange > 0 ? '↑' : '↓'} {Math.abs(insights.monthlyChange || 0).toFixed(1)}% vs last month
                        </StewieText>
                      </View>
                    )}
                  </GlassCard>
                </Animated.View>

                {insights.topCategory && (
                  <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                    <GlassCard elevated intensity={35} style={styles.insightCard}>
                      <StewieText variant="labelMedium" color="muted" style={{ marginBottom: StewiePayBrand.spacing.sm }}>
                        Top Category
                      </StewieText>
                      <View style={styles.topCategoryRow}>
                        <Ionicons
                          name={getCategoryIcon(insights.topCategory) as keyof typeof Ionicons.glyphMap}
                          size={32}
                          color={getCategoryColor(insights.topCategory)}
                        />
                        <StewieText variant="headlineSmall" color="primary" weight="bold" style={{ marginLeft: StewiePayBrand.spacing.sm }}>
                          {insights.topCategory}
                        </StewieText>
                      </View>
                    </GlassCard>
                  </Animated.View>
                )}
              </Animated.View>
            )}

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

            {/* Top Categories Bar Chart */}
            {topCategories.length > 0 && (
              <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
                <GlassCard elevated intensity={35}>
                  <StewieText variant="titleLarge" color="primary" weight="bold" style={styles.sectionTitle}>
                    Top Categories
                  </StewieText>
                  <View style={styles.chartContainer}>
                    <BarChart
                      data={barData}
                      width={CHART_WIDTH}
                      height={220}
                      chartConfig={{
                        backgroundColor: StewiePayBrand.colors.surface,
                        backgroundGradientFrom: StewiePayBrand.colors.surface,
                        backgroundGradientTo: StewiePayBrand.colors.surface,
                        decimalPlaces: 0,
                        color: (opacity = 1) => StewiePayBrand.colors.primary,
                        labelColor: (opacity = 1) => StewiePayBrand.colors.textMuted,
                        style: {
                          borderRadius: StewiePayBrand.radius.lg,
                        },
                      }}
                      style={{
                        marginVertical: StewiePayBrand.spacing.sm,
                        borderRadius: StewiePayBrand.radius.lg,
                      }}
                      yAxisLabel="ETB "
                      yAxisSuffix=""
                      showValuesOnTopOfBars
                    />
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
  changeRow: {
    marginTop: StewiePayBrand.spacing.xs,
  },
  topCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
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

