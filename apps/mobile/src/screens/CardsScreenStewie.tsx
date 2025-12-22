import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { CardsAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieCard } from '../components/stewiepay/StewieCard';
import { StewieText } from '../components/stewiepay/StewieText';
import { StewiePaymentCard } from '../components/stewiepay/StewiePaymentCard';
import { GlassCard } from '../components/modern/GlassCard';
import { SkeletonLoader, SkeletonList } from '../components/modern/SkeletonLoader';
import { Ionicons } from '@expo/vector-icons';

export const CardsScreenStewie = ({ navigation }: any) => {
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

  const handleCreateCard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('CreateCard');
  };

  const handleCardPress = (cardId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('CardDetail', { cardId });
  };

  // Calculate stats
  const activeCards = cards.filter(c => c.status === 'ACTIVE').length;
  const frozenCards = cards.filter(c => c.status === 'FROZEN').length;
  const totalCards = cards.length;


  return (
    <View style={styles.container}>
      {/* StewiePay Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <StewieText variant="headlineLarge" color="primary" weight="black">
          Your Cards
        </StewieText>
        <StewieText variant="bodyMedium" color="muted" style={{ marginTop: StewiePayBrand.spacing.xs }}>
          {totalCards} {totalCards === 1 ? 'card' : 'cards'} • {activeCards} active
        </StewieText>
      </Animated.View>

      {loading && cards.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.loadingContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={StewiePayBrand.colors.primary} />}
        >
          <View style={styles.header}>
            <SkeletonLoader width={200} height={32} borderRadius={8} />
            <SkeletonLoader width={150} height={16} borderRadius={8} style={{ marginTop: 8 }} />
          </View>
          <View style={styles.statsContainer}>
            {[1, 2, 3].map((i) => (
              <SkeletonLoader key={i} width="30%" height={80} borderRadius={StewiePayBrand.radius.lg} />
            ))}
          </View>
          <SkeletonList count={2} />
        </ScrollView>
      ) : cards.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={StewiePayBrand.colors.primary} />}
        >
          <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color={StewiePayBrand.colors.textMuted} style={{ marginBottom: StewiePayBrand.spacing.lg }} />
            <StewieText variant="titleLarge" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.sm }}>
              No Cards Yet
            </StewieText>
            <StewieText variant="bodyMedium" color="muted" style={{ textAlign: 'center', marginBottom: StewiePayBrand.spacing.xl, paddingHorizontal: StewiePayBrand.spacing.lg }}>
              Create your first StewiePay card to start spending with complete control
            </StewieText>
            <TouchableOpacity onPress={handleCreateCard} activeOpacity={0.8}>
              <LinearGradient
                colors={StewiePayBrand.colors.gradients.primary as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.createButton}
              >
                <Ionicons name="add" size={24} color="#FFFFFF" />
                <StewieText variant="titleMedium" color="primary" weight="bold" style={{ marginLeft: StewiePayBrand.spacing.sm }}>
                  Create Card
                </StewieText>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={StewiePayBrand.colors.primary} />}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              {/* Quick Stats */}
              <View style={styles.statsContainer}>
                <GlassCard elevated intensity={15} style={styles.statCard}>
                  <StewieText variant="labelSmall" color="muted" style={{ marginBottom: StewiePayBrand.spacing.xs }}>
                    Active
                  </StewieText>
                  <StewieText variant="headlineMedium" color="primary" weight="bold">
                    {activeCards}
                  </StewieText>
                </GlassCard>
                <GlassCard elevated intensity={15} style={styles.statCard}>
                  <StewieText variant="labelSmall" color="muted" style={{ marginBottom: StewiePayBrand.spacing.xs }}>
                    Frozen
                  </StewieText>
                  <StewieText variant="headlineMedium" color="primary" weight="bold">
                    {frozenCards}
                  </StewieText>
                </GlassCard>
                <GlassCard elevated intensity={15} style={styles.statCard}>
                  <StewieText variant="labelSmall" color="muted" style={{ marginBottom: StewiePayBrand.spacing.xs }}>
                    Total
                  </StewieText>
                  <StewieText variant="headlineMedium" color="primary" weight="bold">
                    {totalCards}
                  </StewieText>
                </GlassCard>
              </View>
            </Animated.View>
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(150 + index * 50).duration(400)}
            >
              <View style={styles.cardWrapper}>
                <TouchableOpacity
                  activeOpacity={0.95}
                  onPress={() => handleCardPress(item.id)}
                >
                  <StewiePaymentCard
                    cardNumber={item.issuerCardId || '4242 4242 4242 4242'}
                    cardholderName={user?.name || 'Cardholder'}
                    type={item.type || 'PERMANENT'}
                    status={item.status}
                    balance={10000}
                    currency="ETB"
                  />
                </TouchableOpacity>
                
                {/* Quick Actions */}
                <View style={styles.quickActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleCardPress(item.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="settings-outline" size={18} color={StewiePayBrand.colors.textMuted} />
                    <StewieText variant="labelSmall" color="muted" style={{ marginTop: 4 }}>
                      Manage
                    </StewieText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      // Quick freeze/unfreeze
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={item.status === 'FROZEN' ? 'snow-outline' : 'snow'} 
                      size={18} 
                      color={item.status === 'FROZEN' ? StewiePayBrand.colors.warning : StewiePayBrand.colors.textMuted} 
                    />
                    <StewieText 
                      variant="labelSmall" 
                      color={item.status === 'FROZEN' ? 'warning' : 'muted'} 
                      style={{ marginTop: 4 }}
                    >
                      {item.status === 'FROZEN' ? 'Frozen' : 'Freeze'}
                    </StewieText>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}
        />
      )}

      {/* FAB - Create Card */}
      {cards.length > 0 && (
        <Animated.View entering={FadeIn.delay(300).duration(400)}>
          <TouchableOpacity
            style={styles.fab}
            onPress={handleCreateCard}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={StewiePayBrand.colors.gradients.primary as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Transparent to show FintechBackground
  },
  header: {
    paddingTop: 60,
    paddingBottom: StewiePayBrand.spacing.lg,
    paddingHorizontal: StewiePayBrand.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'transparent', // Transparent to show FintechBackground
  },
  loadingContent: {
    padding: StewiePayBrand.spacing.lg,
    paddingTop: 80,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: StewiePayBrand.spacing.sm,
    paddingHorizontal: StewiePayBrand.spacing.lg,
    marginBottom: StewiePayBrand.spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: StewiePayBrand.spacing.md,
    alignItems: 'center',
  },
  listContainer: {
    paddingTop: StewiePayBrand.spacing.sm,
    paddingBottom: 100,
  },
  emptyContainer: {
    flexGrow: 1,
    padding: StewiePayBrand.spacing.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: StewiePayBrand.spacing['3xl'],
  },
  cardWrapper: {
    marginBottom: StewiePayBrand.spacing.lg,
    paddingHorizontal: StewiePayBrand.spacing.lg,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: StewiePayBrand.spacing.xl,
    marginTop: StewiePayBrand.spacing.md,
    paddingTop: StewiePayBrand.spacing.md,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: StewiePayBrand.spacing.sm,
    paddingHorizontal: StewiePayBrand.spacing.md,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: StewiePayBrand.spacing.md,
    paddingHorizontal: StewiePayBrand.spacing.lg,
    borderRadius: StewiePayBrand.radius.lg,
    ...StewiePayBrand.shadows.md,
  },
  fab: {
    position: 'absolute',
    right: StewiePayBrand.spacing.lg,
    bottom: StewiePayBrand.spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
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

