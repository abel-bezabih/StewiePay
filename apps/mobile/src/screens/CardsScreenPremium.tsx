// @ts-nocheck - Premium screen not in use, using react-native-paper which is not installed
import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
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
  ActivityIndicator
} from 'react-native-paper';
import { useTheme } from 'react-native-paper';
*/
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { CardsAPI } from '../api/client';
import { PremiumCardV2 } from '../components/PremiumCardV2';
import { InteractiveCard } from '../components/InteractiveCard';
import { EmptyState } from '../components/EmptyState';
import { BrandHeader } from '../components/BrandHeader';
import { StewiePayBrand } from '../brand/StewiePayBrand';

export const CardsScreenPremium = ({ navigation }: any) => {
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

  const handleCardPress = (cardId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('CardDetail', { cardId });
  };

  const handleCreateCard = () => {
    const kycStatus = (user as any)?.kycStatus || 'PENDING';
    if (kycStatus !== 'VERIFIED') {
      const message =
        kycStatus === 'SUBMITTED'
          ? 'Your KYC is under review. Card creation will unlock after approval.'
          : kycStatus === 'REJECTED'
            ? `KYC rejected: ${(user as any)?.kycRejectionReason || 'Please resubmit to continue.'}`
            : 'Please complete KYC to create cards.';
      Alert.alert('KYC required', message, [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open KYC', onPress: () => navigation.navigate('KycVerification') }
      ]);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('CreateCard');
  };

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
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      {/* Revolut-Style Header */}
      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.headerTitle}>
          Your Cards
        </Text>
      </View>
      
      {/* Create Card FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: StewiePayBrand.colors.primary }]}
        onPress={handleCreateCard}
        label="New Card"
      />

      {loading && cards.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={32} color={theme.colors.primary} />
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
            Loading your cards...
          </Text>
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          contentContainerStyle={cards.length === 0 ? styles.emptyContainer : styles.listContainer}
          renderItem={({ item, index }) => (
            <Animatable.View
              animation="fadeInUp"
              delay={index * 100}
              duration={400}
            >
              <Card
                style={[styles.cardItem, { backgroundColor: '#1A1A1A' }]}
                onPress={() => handleCardPress(item.id)}
              >
                <Card.Content style={styles.cardContent}>
                  <PremiumCardV2
                    cardNumber={item.issuerCardId || '4242 4242 4242 4242'}
                    cardholderName={user?.name || 'Cardholder'}
                    type={item.type || 'PERMANENT'}
                    status={item.status}
                    balance={10000}
                    currency="ETB"
                  />
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
            </Animatable.View>
          )}
          ListEmptyComponent={
            !loading ? (
              <Animatable.View animation="fadeIn" duration={600}>
                <EmptyState
                  icon="💳"
                  title="No cards yet"
                  subtitle="Create your first card to start controlling your spend with limits, merchant locks, and more."
                  actionLabel="Create Card"
                  onAction={handleCreateCard}
                />
              </Animatable.View>
            ) : null
          }
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreateCard}
        label="New Card"
      />
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
    elevation: 0,
    borderRadius: 16,
    backgroundColor: '#1A1A1A'
  },
  cardContent: {
    padding: 0
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)'
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

