import React, { useEffect, useState } from 'react';
import { View, RefreshControl, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { PremiumCard } from '../components/PremiumCard';
import { EmptyState } from '../components/EmptyState';
import { useTheme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { CardsAPI } from '../api/client';
import * as Haptics from 'expo-haptics';

export const CardsScreen = ({ navigation }: any) => {
  const { spacing, colors, radius } = useTheme();
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
    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation]);

  const handleCreateCard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('CreateCard');
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(4) }}>
        <Text variant="title" style={{ fontSize: 32, fontWeight: '800' }}>
          Cards
        </Text>
        <TouchableOpacity
          onPress={handleCreateCard}
          style={[
            styles.addButton,
            {
              backgroundColor: colors.accent,
              borderRadius: 22,
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center'
            }
          ]}
        >
          <Text style={{ color: '#0B1224', fontSize: 24, fontWeight: '700' }}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <PremiumCard
            cardNumber={item.issuerCardId || '4242 4242 4242 4242'}
            cardholderName={user?.name || 'Cardholder'}
            type={item.type || 'PERMANENT'}
            status={item.status}
            onPress={() => navigation.navigate('CardDetail', { cardId: item.id })}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="💳"
              title="No cards yet"
              subtitle="Create your first card to start controlling your spend with limits, merchant locks, and more."
              actionLabel="Create Card"
              onAction={handleCreateCard}
            />
          ) : null
        }
        contentContainerStyle={cards.length === 0 ? { flexGrow: 1 } : { paddingBottom: spacing(4) }}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  addButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  }
});






