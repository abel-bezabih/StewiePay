// @ts-nocheck - Premium screen not in use, using react-native-paper which is not installed
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Dimensions,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
// These imports are commented out as react-native-paper is not installed
// The screen is not currently used in navigation
/*
import {
  Surface,
  Text,
  Card,
  Chip,
  ActivityIndicator,
  ProgressBar,
  Divider
} from 'react-native-paper';
import { useTheme } from 'react-native-paper';
*/
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { AnalyticsAPI } from '../api/client';
import { EmptyState } from '../components/EmptyState';
import { BrandHeader } from '../components/BrandHeader';
import { GlassmorphicCard } from '../components/GlassmorphicCard';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { ProgressRing } from '../components/ProgressRing';
import { StewiePayBrand } from '../brand/StewiePayBrand';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 40;

const getCategoryIcon = (category?: string): string => {
  const icons: Record<string, string> = {
    'Food & Drink': '🍔',
    'Shopping': '🛍️',
    'Travel': '✈️',
    'Entertainment': '🎬',
    'Bills & Utilities': '💡',
    'Transportation': '🚗',
    'Healthcare': '🏥',
    'Education': '📚',
    'Gambling': '🎰',
    'Other': '📦'
  };
  return icons[category || 'Other'] || '📦';
};

const getCategoryColor = (category?: string): string => {
  const colors: Record<string, string> = {
    'Food & Drink': '#F59E0B',
    'Shopping': '#8B5CF6',
    'Travel': '#3B82F6',
    'Entertainment': '#EC4899',
    'Bills & Utilities': '#10B981',
    'Transportation': '#6366F1',
    'Healthcare': '#EF4444',
    'Education': '#06B6D4',
    'Gambling': '#F97316',
    'Other': '#6B7280'
  };
  return colors[category || 'Other'] || '#6B7280';
};

const formatCurrency = (amount: number, currency: string = 'ETB'): string => {
  return `${currency} ${amount.toLocaleString()}`;
};

export const AnalyticsScreenPremium = ({ navigation }: any) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [topCategories, setTopCategories] = useState<any[]>([]);
  
  // Revolut-style background
  const containerStyle = { backgroundColor: '#000000' };

  const loadData = async () => {
    try {
      const [categoryResp, insightsResp, topResp] = await Promise.all([
        AnalyticsAPI.spendByCategory().catch(() => ({ data: [] })),
        AnalyticsAPI.insights().catch(() => ({ data: null })),
        AnalyticsAPI.topCategories(5).catch(() => ({ data: [] }))
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
      <View style={[styles.loadingContainer, { backgroundColor: '#000000' }]}>
        <ActivityIndicator size="large" color="#00D9FF" />
        <Text variant="bodyMedium" style={{ color: '#999999', marginTop: 16 }}>
          Loading analytics...
        </Text>
      </View>
    );
  }

  const hasData = categoryData.length > 0;

  // Prepare pie chart data
  const pieData = categoryData.slice(0, 6).map((item) => ({
    name: item.category,
    amount: item.amount,
    color: getCategoryColor(item.category),
    legendFontColor: theme.colors.onSurface,
    legendFontSize: 12
  }));

  // Prepare bar chart data
  const barData = {
    labels: topCategories.slice(0, 5).map((c) => getCategoryIcon(c.category)),
    datasets: [
      {
        data: topCategories.slice(0, 5).map((c) => c.amount)
      }
    ]
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Revolut-Style Header */}
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.headerTitle}>
            Analytics
          </Text>
        </View>

        {!hasData ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="📊"
              title="No analytics yet"
              subtitle="Start making transactions to see your spending insights"
            />
          </View>
        ) : (
          <>
            {/* Revolutionary Insights Cards with Glassmorphism */}
            {insights && (
              <View style={styles.insightsContainer}>
                <Animatable.View animation="fadeInUp" delay={100} duration={400}>
                  <View style={styles.insightCard}>
                    <Text variant="bodyMedium" style={{ color: '#999999', marginBottom: 8 }}>
                      Total Spend
                    </Text>
                    <AnimatedCounter
                      value={insights.totalSpend}
                      prefix="ETB "
                      useSpring={true}
                      style={{ fontSize: 32, fontWeight: '700', color: '#FFFFFF' }}
                    />
                    <Text variant="bodySmall" style={{ color: '#999999', marginTop: 8 }}>
                      {insights.totalTransactions} transactions
                    </Text>
                  </View>
                </Animatable.View>

                <Animatable.View animation="fadeInUp" delay={200} duration={400}>
                  <View style={styles.insightCard}>
                    <Text variant="bodyMedium" style={{ color: '#999999', marginBottom: 8 }}>
                      This Month
                    </Text>
                    <AnimatedCounter
                      value={insights.monthlySpend}
                      prefix="ETB "
                      useSpring={true}
                      style={{ fontSize: 32, fontWeight: '700', color: '#FFFFFF' }}
                    />
                    {insights.monthlyChange !== 0 && (
                      <View style={styles.changeRow}>
                        <Text
                          variant="bodySmall"
                          style={{
                            color: insights.monthlyChange > 0 ? '#FF6B6B' : '#00D9FF',
                            marginTop: 8
                          }}
                        >
                          {insights.monthlyChange > 0 ? '↑' : '↓'}{' '}
                          {Math.abs(insights.monthlyChange).toFixed(1)}% vs last month
                        </Text>
                      </View>
                    )}
                  </View>
                </Animatable.View>

                {insights.topCategory && (
                  <Animatable.View animation="fadeInUp" delay={300} duration={400}>
                    <View style={styles.insightCard}>
                      <Text variant="bodyMedium" style={{ color: '#999999', marginBottom: 8 }}>
                        Top Category
                      </Text>
                      <View style={styles.topCategoryRow}>
                        <Text style={styles.topCategoryIcon}>
                          {getCategoryIcon(insights.topCategory)}
                        </Text>
                        <Text
                          variant="headlineSmall"
                          style={{ fontWeight: '700', color: '#FFFFFF', marginLeft: 8 }}
                        >
                          {insights.topCategory}
                        </Text>
                      </View>
                    </View>
                  </Animatable.View>
                )}
              </View>
            )}

            {/* Category Breakdown */}
            {categoryData.length > 0 && (
              <Animatable.View animation="fadeInUp" delay={400} duration={400}>
                <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                  <Text variant="titleLarge" style={styles.sectionTitle}>
                    Spending by Category
                  </Text>

                  {/* Pie Chart */}
                  {pieData.length > 0 && (
                    <View style={styles.chartContainer}>
                      <PieChart
                        data={pieData}
                        width={CHART_WIDTH}
                        height={220}
                        chartConfig={{
                          backgroundColor: theme.colors.surface,
                          backgroundGradientFrom: theme.colors.surface,
                          backgroundGradientTo: theme.colors.surface,
                          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`
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
                      <Animatable.View
                        key={item.category || 'Other'}
                        animation="fadeInRight"
                        delay={500 + index * 50}
                        duration={300}
                      >
                        <TouchableOpacity
                          style={[
                            styles.categoryItem,
                            { backgroundColor: '#2A2A2A' }
                          ]}
                        >
                          <View style={styles.categoryItemLeft}>
                            <View
                              style={[
                                styles.categoryIcon,
                                { backgroundColor: getCategoryColor(item.category) + '20' }
                              ]}
                            >
                              <Text style={styles.categoryIconText}>
                                {getCategoryIcon(item.category)}
                              </Text>
                            </View>
                            <View style={styles.categoryInfo}>
                              <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                                {item.category}
                              </Text>
                              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                {item.count} {item.count === 1 ? 'transaction' : 'transactions'}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.categoryItemRight}>
                            <Text
                              variant="titleMedium"
                              style={{ fontWeight: '800', color: theme.colors.onSurface }}
                            >
                              {formatCurrency(item.amount)}
                            </Text>
                            <View style={styles.percentageRow}>
                              <ProgressBar
                                progress={item.percentage / 100}
                                color={getCategoryColor(item.category)}
                                style={styles.progressBar}
                              />
                              <Text
                                variant="bodySmall"
                                style={{
                                  color: theme.colors.onSurfaceVariant,
                                  marginLeft: 8,
                                  minWidth: 50,
                                  textAlign: 'right'
                                }}
                              >
                                {item.percentage.toFixed(1)}%
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                        {index < categoryData.length - 1 && (
                          <Divider style={{ marginVertical: 8 }} />
                        )}
                      </Animatable.View>
                    ))}
                  </View>
                </Surface>
              </Animatable.View>
            )}

            {/* Top Categories Bar Chart */}
            {topCategories.length > 0 && (
              <Animatable.View animation="fadeInUp" delay={600} duration={400}>
                <View style={[styles.section, { backgroundColor: '#1A1A1A' }]}>
                  <Text variant="titleLarge" style={[styles.sectionTitle, { color: '#FFFFFF' }]}>
                    Top Categories
                  </Text>
                  <View style={styles.chartContainer}>
                    <BarChart
                      data={barData}
                      width={CHART_WIDTH}
                      height={220}
                      yAxisLabel=""
                      yAxisSuffix=""
                      chartConfig={{
                        backgroundColor: theme.colors.surface,
                        backgroundGradientFrom: theme.colors.surface,
                        backgroundGradientTo: theme.colors.surface,
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        style: {
                          borderRadius: 16
                        },
                        barPercentage: 0.7
                      }}
                      style={{
                        marginVertical: 8,
                        borderRadius: 16
                      }}
                      showValuesOnTopOfBars
                      fromZero
                    />
                    </View>
                  </View>
                </Animatable.View>
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
    backgroundColor: '#0A0A0A' // Darker than cards but not pure black
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 32
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4
  },
  emptyContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400
  },
  insightsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    flexWrap: 'wrap'
  },
  insightCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    elevation: 2
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  topCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  topCategoryIcon: {
    fontSize: 32
  },
  section: {
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    elevation: 2
  },
  sectionTitle: {
    fontWeight: '800',
    marginBottom: 20
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16
  },
  categoryList: {
    marginTop: 8
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12
  },
  categoryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  categoryIconText: {
    fontSize: 20
  },
  categoryInfo: {
    flex: 1
  },
  categoryItemRight: {
    alignItems: 'flex-end'
  },
  percentageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    width: 120
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    flex: 1
  }
});

