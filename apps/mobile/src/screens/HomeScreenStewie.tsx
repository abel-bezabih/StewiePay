import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Animated, {
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { useAuth } from '../contexts/AuthContext';
import { CardsAPI, AnalyticsAPI, SubscriptionsAPI, TransactionsAPI } from '../api/client';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieCard } from '../components/stewiepay/StewieCard';
import { StewieText } from '../components/stewiepay/StewieText';
import { StewiePaymentCard } from '../components/stewiepay/StewiePaymentCard';
import { GlassCard } from '../components/modern/GlassCard';
import { SkeletonLoader, SkeletonCard } from '../components/modern/SkeletonLoader';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;

export const HomeScreenStewie = ({ navigation }: any) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Core state
  const [primaryCard, setPrimaryCard] = useState<any>(null);
  const [allCards, setAllCards] = useState<any[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [availableThisMonth, setAvailableThisMonth] = useState(50000);
  const [monthlyLimit, setMonthlyLimit] = useState(50000);
  const [monthlySpend, setMonthlySpend] = useState(0);
  const [nextCharge, setNextCharge] = useState<any>(null);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [hasTransactions, setHasTransactions] = useState(false);
  const [activeCardsCount, setActiveCardsCount] = useState(0);

  const loadData = async () => {
    try {
      const [cardsResp, analyticsResp, subsResp, txnsResp] = await Promise.all([
        CardsAPI.list().catch(() => ({ data: [] })),
        AnalyticsAPI.spendByMonth().catch(() => ({ data: [] })),
        SubscriptionsAPI.list().catch(() => ({ data: [] })),
        TransactionsAPI.list().catch(() => ({ data: [] })),
      ]);

      const cards = cardsResp.data || [];
      const primary = cards.find((c: any) => c.status === 'ACTIVE') || cards[0] || null;
      setPrimaryCard(primary);
      setAllCards(cards);
      setActiveCardsCount(cards.filter((c: any) => c.status === 'ACTIVE').length);

      const monthlyData = analyticsResp.data?.[analyticsResp.data.length - 1];
      const spend = monthlyData?.total || 0;
      const limit = monthlyLimit;
      setMonthlySpend(spend);
      setAvailableThisMonth(Math.max(0, limit - spend));

      // Get next upcoming charge
      const subs = subsResp.data || [];
      setSubscriptions(subs);
      const upcoming = subs.find((s: any) => s.nextExpectedCharge) || null;
      setNextCharge(upcoming);

      // Get last transaction (most recent first, assuming backend returns sorted)
      const txns = txnsResp.data || [];
      setHasTransactions(txns.length > 0);
      // Sort by date descending to get most recent
      const sortedTxns = [...txns].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.date || 0).getTime();
        const dateB = new Date(b.createdAt || b.date || 0).getTime();
        return dateB - dateA;
      });
      setLastTransaction(sortedTxns[0] || null);
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

  // Calculate days until reset (assuming monthly reset on 1st)
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const spendPercentage = monthlyLimit > 0 ? (monthlySpend / monthlyLimit) * 100 : 0;
  const percentageUsed = monthlyLimit > 0 ? (monthlySpend / monthlyLimit) * 100 : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ScrollView
          contentContainerStyle={styles.loadingContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Skeleton */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <SkeletonLoader width={150} height={32} borderRadius={8} />
              <SkeletonLoader width={32} height={32} borderRadius={16} />
            </View>
          </View>
          
          {/* Card Skeleton */}
          <View style={{ marginBottom: StewiePayBrand.spacing.lg }}>
            <SkeletonLoader width="100%" height={220} borderRadius={StewiePayBrand.radius.xl} />
          </View>
          
          {/* Info Cards Skeletons */}
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ marginBottom: StewiePayBrand.spacing.md }}>
              <SkeletonCard />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={StewiePayBrand.colors.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Compact Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <StewieText variant="headlineMedium" color="brand" weight="black">
                StewiePay
              </StewieText>
              {primaryCard && (
                <StewieText variant="bodySmall" color="muted" style={{ marginTop: 4 }}>
                  {activeCardsCount} {activeCardsCount === 1 ? 'card' : 'cards'} active
                </StewieText>
              )}
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Account');
              }}
              style={styles.profileButton}
            >
              <View style={styles.avatar}>
                <StewieText variant="bodyMedium" color="primary" weight="bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </StewieText>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Swappable Card Carousel - Centered with Revolut-style stacking */}
        {allCards.length > 0 ? (
          <View style={styles.cardCarouselContainer}>
            <SwipeableCardStack
              cards={allCards}
              user={user}
              onCardPress={(cardId) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('CardDetail', { cardId });
              }}
            />
          </View>
        ) : (
          <View style={styles.emptyCardContainer}>
            <GlassCard elevated intensity={40} style={styles.emptyCardState}>
              <View style={styles.emptyCardContent}>
                <Ionicons name="card-outline" size={56} color={StewiePayBrand.colors.textMuted} style={{ marginBottom: StewiePayBrand.spacing.md }} />
                <StewieText variant="titleLarge" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.xs }}>
                  No card selected
                </StewieText>
              </View>
            </GlassCard>
          </View>
        )}

        {/* Dense Information Layers - Stacked Compact Sections */}

        {/* Layer 1: Available Power (Compact) */}
        <View style={styles.infoRow}>
          <GlassCard elevated intensity={35} style={styles.compactCard}>
            <View style={styles.rowContent}>
              <View style={styles.rowLeft}>
                <StewieText variant="labelMedium" color="muted">
                  Available this month
                </StewieText>
                <StewieText variant="headlineSmall" color="primary" weight="black" style={{ marginTop: 4 }}>
                  ETB {availableThisMonth.toLocaleString()}
                </StewieText>
              </View>
              <View style={styles.rowRight}>
                <View style={styles.compactProgressBar}>
                  <View
                    style={[
                      styles.compactProgressFill,
                      { width: `${Math.min(100 - spendPercentage, 100)}%` },
                    ]}
                  />
                </View>
                <StewieText variant="bodySmall" color="muted" style={{ marginTop: 6 }}>
                  {daysUntilReset} {daysUntilReset === 1 ? 'day' : 'days'} until reset
                </StewieText>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Layer 2: Monthly Spend Metadata */}
        <View style={styles.infoRow}>
          <GlassCard elevated intensity={35} style={styles.compactCard}>
            <View style={styles.metadataRow}>
              <View style={styles.metadataItem}>
                <StewieText variant="labelSmall" color="muted">
                  Spent this month
                </StewieText>
                <StewieText variant="titleMedium" color="primary" weight="bold" style={{ marginTop: 2 }}>
                  ETB {monthlySpend.toLocaleString()}
                </StewieText>
              </View>
              <View style={styles.separator} />
              <View style={styles.metadataItem}>
                <StewieText variant="labelSmall" color="muted">
                  Monthly limit
                </StewieText>
                <StewieText variant="titleMedium" color="primary" weight="bold" style={{ marginTop: 2 }}>
                  ETB {monthlyLimit.toLocaleString()}
                </StewieText>
              </View>
              <View style={styles.separator} />
              <View style={styles.metadataItem}>
                <StewieText variant="labelSmall" color="muted">
                  Used
                </StewieText>
                <StewieText variant="titleMedium" color="primary" weight="bold" style={{ marginTop: 2 }}>
                  {percentageUsed.toFixed(0)}%
                </StewieText>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Layer 3: Last Activity (Compact) */}
        {lastTransaction && (
          <View style={styles.infoRow}>
            <GlassCard elevated intensity={35} style={styles.compactCard}>
              <View style={styles.rowContent}>
                <View style={styles.rowLeft}>
                  <StewieText variant="labelMedium" color="muted">
                    Last activity
                  </StewieText>
                  <View style={styles.activityDetails}>
                    <StewieText variant="bodyMedium" color="primary" weight="medium">
                      {lastTransaction.merchantName}
                    </StewieText>
                    <StewieText variant="bodySmall" color="muted" style={{ marginLeft: 8 }}>
                      ETB {Math.abs(lastTransaction.amount).toLocaleString()}
                    </StewieText>
                  </View>
                </View>
                <Ionicons name="chevron-forward-outline" size={18} color={StewiePayBrand.colors.textMuted} />
              </View>
            </GlassCard>
          </View>
        )}

        {/* Layer 4: Upcoming Charges (Compact) */}
        <View style={styles.infoRow}>
          <GlassCard elevated intensity={35} style={styles.compactCard}>
            <View style={styles.rowContent}>
              <View style={styles.rowLeft}>
                <StewieText variant="labelMedium" color="muted">
                  Upcoming charges
                </StewieText>
                {nextCharge ? (
                  <View style={styles.activityDetails}>
                    <StewieText variant="bodyMedium" color="primary" weight="medium">
                      {nextCharge.merchant}
                    </StewieText>
                    <StewieText variant="bodySmall" color="muted" style={{ marginLeft: 8 }}>
                      ETB {nextCharge.amountHint?.toLocaleString() || '—'} · {nextCharge.nextExpectedCharge ? formatNextChargeDate(nextCharge.nextExpectedCharge) : '—'}
                    </StewieText>
                  </View>
                ) : (
                  <StewieText variant="bodyMedium" color="muted" style={{ marginTop: 4 }}>
                    No upcoming charges detected
                  </StewieText>
                )}
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Layer 5: System Health (Compact) */}
        <View style={styles.infoRow}>
          <GlassCard elevated intensity={35} style={styles.compactCard}>
            <View style={styles.rowContent}>
              <View style={styles.healthIndicator} />
              <StewieText variant="bodyMedium" color="muted">
                All systems operational
              </StewieText>
            </View>
          </GlassCard>
        </View>

        {/* Layer 6: Discovery - Active Subscriptions Count */}
        {subscriptions.length > 0 && (
          <View style={styles.infoRow}>
            <GlassCard elevated intensity={35} style={styles.compactCard}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Subscriptions')}
                style={styles.rowContent}
                activeOpacity={0.7}
              >
                <View style={styles.rowLeft}>
                  <Ionicons name="repeat-outline" size={18} color={StewiePayBrand.colors.primary} style={{ marginRight: 8 }} />
                  <View>
                    <StewieText variant="bodyMedium" color="primary" weight="medium">
                      {subscriptions.length} {subscriptions.length === 1 ? 'subscription' : 'subscriptions'} detected
                    </StewieText>
                    <StewieText variant="bodySmall" color="muted" style={{ marginTop: 2 }}>
                      Monitoring recurring charges
                    </StewieText>
                  </View>
                </View>
                <Ionicons name="chevron-forward-outline" size={18} color={StewiePayBrand.colors.textMuted} />
              </TouchableOpacity>
            </GlassCard>
          </View>
        )}

        {/* Layer 7: Context-Aware Action (Subtle) */}
        {!primaryCard && (
          <View style={styles.infoRow}>
            <GlassCard elevated intensity={35} style={StyleSheet.flatten([styles.compactCard, styles.actionCard])}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('CreateCard');
                }}
                style={styles.rowContent}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={20} color={StewiePayBrand.colors.primary} style={{ marginRight: 8 }} />
                <StewieText variant="bodyMedium" color="primary" weight="medium">
                  Create your first card
                </StewieText>
              </TouchableOpacity>
            </GlassCard>
          </View>
        )}

        {percentageUsed > 80 && primaryCard && (
          <View style={styles.infoRow}>
            <GlassCard elevated intensity={35} style={StyleSheet.flatten([styles.compactCard, styles.actionCard])}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('CardDetail', { cardId: primaryCard.id });
                }}
                style={styles.rowContent}
                activeOpacity={0.7}
              >
                <Ionicons name="settings-outline" size={20} color={StewiePayBrand.colors.primary} style={{ marginRight: 8 }} />
                <StewieText variant="bodyMedium" color="primary" weight="medium">
                  Adjust limits
                </StewieText>
              </TouchableOpacity>
            </GlassCard>
          </View>
        )}

        <View style={{ height: StewiePayBrand.spacing.xl }} />
      </ScrollView>

      {/* FAB - Only when no cards */}
      {allCards.length === 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('CreateCard');
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={StewiePayBrand.colors.gradients.primary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Swipeable Card Stack Component - Using FlatList for reliable swiping
interface SwipeableCardStackProps {
  cards: any[];
  user: any;
  onCardPress: (cardId: string) => void;
}

// Separate component for each card to use hooks properly
const AnimatedCard: React.FC<{
  card: any;
  index: number;
  scrollX: any; // SharedValue<number>
  cardsLength: number;
  user: any;
  onCardPress: (cardId: string) => void;
}> = ({ card, index, scrollX, cardsLength, user, onCardPress }) => {
  const pulse = useSharedValue(1);
  const isActive = useSharedValue(false);

  // Monitor when card becomes active for pulsing effect
  useAnimatedReaction(
    () => scrollX.value,
    (current) => {
      const cardOffset = current - index * (CARD_WIDTH + 20);
      const wasActive = isActive.value;
      isActive.value = Math.abs(cardOffset) < 10;
      
      if (isActive.value && !wasActive) {
        // Start pulsing when card becomes active
        pulse.value = withRepeat(
          withTiming(1.02, { duration: 2000 }),
          -1,
          true
        );
      } else if (!isActive.value && wasActive) {
        // Stop pulsing when card becomes inactive
        pulse.value = withTiming(1, { duration: 300 });
      }
    }
  );

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const cardOffset = scrollX.value - index * (CARD_WIDTH + 20);
    const absOffset = Math.abs(cardOffset);
    const normalizedOffset = Math.min(absOffset / (CARD_WIDTH + 20), 1);
    
    // Revolut-style: Cards behind scale down more dramatically
    const baseScale = interpolate(
      normalizedOffset,
      [0, 0.3, 0.7, 1],
      [1.0, 0.98, 0.92, 0.85],
      Extrapolate.CLAMP
    );
    
    // Apply pulsing to active card
    const scale = isActive.value ? baseScale * pulse.value : baseScale;

    // Opacity: Active card fully opaque, cards behind fade more
    const opacity = interpolate(
      normalizedOffset,
      [0, 0.3, 0.7, 1],
      [1.0, 0.95, 0.75, 0.5],
      Extrapolate.CLAMP
    );

    // TranslateY: Cards behind move up to create depth (more pronounced)
    const translateY = interpolate(
      normalizedOffset,
      [0, 0.3, 0.7, 1],
      [0, -6, -14, -22],
      Extrapolate.CLAMP
    );

    // Subtle rotation for depth (Revolut-style)
    const rotateY = interpolate(
      cardOffset,
      [-(CARD_WIDTH + 20), 0, CARD_WIDTH + 20],
      [-2, 0, 2],
      Extrapolate.CLAMP
    );

    // Z-index: Active card on top, others stack behind
    const zIndexValue = Math.max(0, cardsLength - Math.floor(normalizedOffset * 2));

    return {
      transform: [
        { scale },
        { translateY },
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
      ],
      opacity,
      zIndex: zIndexValue,
    };
  });

  return (
    <Animated.View style={[styles.swipeableCardContainer, animatedStyle]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          try {
            onCardPress(card.id);
          } catch (e) {
            console.error('Card press error:', e);
          }
        }}
      >
        <StewiePaymentCard
          cardNumber={card.issuerCardId || '4242 4242 4242 4242'}
          cardholderName={user?.name || 'Cardholder'}
          type={card.type || 'PERMANENT'}
          status={card.status}
          balance={10000}
          currency="ETB"
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const SwipeableCardStack: React.FC<SwipeableCardStackProps> = ({ cards, user, onCardPress }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const onViewableItemsChanged = React.useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      if (newIndex !== null && newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {
          // Ignore haptic errors
        }
      }
    }
  }).current;

  const viewabilityConfig = React.useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event: any) => {
      'worklet';
      scrollX.value = event.contentOffset.x;
    },
  });

  const renderCard = ({ item: card, index }: { item: any; index: number }) => {
    return (
      <AnimatedCard
        card={card}
        index={index}
        scrollX={scrollX}
        cardsLength={cards.length}
        user={user}
        onCardPress={onCardPress}
      />
    );
  };

  return (
    <View style={styles.swipeableStackContainer}>
      <Animated.FlatList
        ref={flatListRef}
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 20}
        snapToAlignment="center"
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={styles.flatListContent}
        style={styles.flatList}
        getItemLayout={(data, index) => ({
          length: CARD_WIDTH + 20,
          offset: (CARD_WIDTH + 20) * index,
          index,
        })}
      />
      
      {/* Card indicators */}
      {cards.length > 1 && (
        <View style={styles.cardIndicators}>
          {cards.map((_, index) => {
            const isActive = currentIndex === index;
            return (
              <View
                key={index}
                style={[
                  styles.cardIndicator,
                  {
                    backgroundColor: isActive
                      ? StewiePayBrand.colors.primary
                      : StewiePayBrand.colors.surfaceVariant,
                    width: isActive ? 24 : 8,
                    opacity: isActive ? 1 : 0.4,
                  },
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

function formatNextChargeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Past due';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

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
    paddingTop: 80,
  },
  scrollContent: {
    paddingBottom: StewiePayBrand.spacing.xl,
  },
  header: {
    paddingTop: 60,
    paddingBottom: StewiePayBrand.spacing.md,
    paddingHorizontal: StewiePayBrand.spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileButton: {
    marginTop: StewiePayBrand.spacing.xs,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: StewiePayBrand.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: StewiePayBrand.colors.primary + '40',
  },
  cardCarouselContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: StewiePayBrand.spacing.xl,
    marginBottom: StewiePayBrand.spacing.md,
    overflow: 'visible',
  },
  emptyCardContainer: {
    paddingHorizontal: StewiePayBrand.spacing.lg,
    marginBottom: StewiePayBrand.spacing.md,
    alignItems: 'center',
  },
  swipeableStackContainer: {
    width: SCREEN_WIDTH,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  flatList: {
    flexGrow: 0,
  },
  flatListContent: {
    paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2 - 10,
    alignItems: 'center',
    paddingVertical: 40,
    justifyContent: 'center',
  },
  swipeableCardContainer: {
    width: CARD_WIDTH,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  cardIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: StewiePayBrand.spacing.md,
  },
  cardIndicator: {
    height: 6,
    borderRadius: 3,
  },
  emptyCardState: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: StewiePayBrand.colors.surfaceVariant,
  },
  emptyCardContent: {
    alignItems: 'center',
    paddingVertical: StewiePayBrand.spacing['3xl'],
  },
  infoRow: {
    paddingHorizontal: StewiePayBrand.spacing.lg,
    marginBottom: StewiePayBrand.spacing.sm,
  },
  compactCard: {
    paddingVertical: StewiePayBrand.spacing.md,
    paddingHorizontal: StewiePayBrand.spacing.md,
    minHeight: 0,
  },
  rowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeft: {
    flex: 1,
  },
  rowRight: {
    alignItems: 'flex-end',
    marginLeft: StewiePayBrand.spacing.md,
  },
  compactProgressBar: {
    width: 80,
    height: 3,
    backgroundColor: StewiePayBrand.colors.surfaceVariant,
    borderRadius: StewiePayBrand.radius.full,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    backgroundColor: StewiePayBrand.colors.primary,
    opacity: 0.3,
    borderRadius: StewiePayBrand.radius.full,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metadataItem: {
    flex: 1,
    alignItems: 'center',
  },
  separator: {
    width: 1,
    height: 32,
    backgroundColor: StewiePayBrand.colors.surfaceVariant,
    marginHorizontal: StewiePayBrand.spacing.sm,
  },
  activityDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  healthIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: StewiePayBrand.colors.success,
    marginRight: StewiePayBrand.spacing.sm,
  },
  actionCard: {
    borderWidth: 1,
    borderColor: StewiePayBrand.colors.surfaceVariant,
  },
  fab: {
    position: 'absolute',
    right: StewiePayBrand.spacing.lg,
    bottom: StewiePayBrand.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    ...StewiePayBrand.shadows.lg,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
