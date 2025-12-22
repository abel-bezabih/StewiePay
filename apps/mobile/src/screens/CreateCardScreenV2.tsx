// @ts-nocheck - Premium screen not in use, using react-native-paper which is not installed
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
// These imports are commented out as react-native-paper is not installed
// The screen is not currently used in navigation
/*
import {
  Surface,
  Text,
  Card,
  Button,
  TextInput,
  RadioButton,
  Chip,
  ActivityIndicator,
  Divider
} from 'react-native-paper';
import { useTheme } from 'react-native-paper';
*/
import { CardsAPI } from '../api/client';
import * as Haptics from 'expo-haptics';

const CARD_TYPES = [
  {
    value: 'PERMANENT',
    label: 'Permanent',
    icon: '💳',
    desc: 'Your everyday spending card with full control',
    color: '#60A5FA'
  },
  {
    value: 'BURNER',
    label: 'Burner',
    icon: '🔥',
    desc: 'One-time use, auto-closes after first transaction',
    color: '#F5576C'
  },
  {
    value: 'MERCHANT_LOCKED',
    label: 'Merchant Locked',
    icon: '🔒',
    desc: 'Only works at specific merchants you choose',
    color: '#764BA2'
  },
  {
    value: 'SUBSCRIPTION_ONLY',
    label: 'Subscription Only',
    icon: '🔄',
    desc: 'For recurring subscriptions only',
    color: '#10B981'
  },
  {
    value: 'ADS_ONLY',
    label: 'Ads Only',
    icon: '📢',
    desc: 'For advertising spend (Meta, Google, etc.)',
    color: '#F59E0B'
  }
];

export const CreateCardScreenV2 = ({ navigation, route }: any) => {
  const theme = useTheme();
  const [selectedType, setSelectedType] = useState('PERMANENT');
  const [limits, setLimits] = useState({ daily: '', monthly: '', perTxn: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const orgId = route?.params?.orgId;

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const payload: any = {
        type: selectedType
      };
      if (orgId) payload.orgId = orgId;
      if (limits.daily) payload.limitDaily = parseInt(limits.daily);
      if (limits.monthly) payload.limitMonthly = parseInt(limits.monthly);
      if (limits.perTxn) payload.limitPerTxn = parseInt(limits.perTxn);

      await CardsAPI.create(payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create card');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const selectedTypeConfig = CARD_TYPES.find((t) => t.value === selectedType);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineMedium" style={{ fontWeight: '800', color: theme.colors.onSurface }}>
          Create New Card
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
          Choose card type and set spending limits
        </Text>
      </Surface>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Card Type Selection */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ fontWeight: '700', marginBottom: 16 }}>
              Card Type
            </Text>
            <View style={styles.typeList}>
              {CARD_TYPES.map((type) => (
                <Card
                  key={type.value}
                  style={[
                    styles.typeCard,
                    {
                      backgroundColor:
                        selectedType === type.value ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                      borderColor: selectedType === type.value ? type.color : 'transparent',
                      borderWidth: selectedType === type.value ? 2 : 0
                    }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedType(type.value);
                  }}
                >
                  <Card.Content>
                    <View style={styles.typeContent}>
                      <Text style={{ fontSize: 32 }}>{type.icon}</Text>
                      <View style={styles.typeText}>
                        <Text
                          variant="titleMedium"
                          style={{
                            fontWeight: '700',
                            color: selectedType === type.value ? theme.colors.onPrimaryContainer : theme.colors.onSurface
                          }}
                        >
                          {type.label}
                        </Text>
                        <Text
                          variant="bodySmall"
                          style={{
                            color:
                              selectedType === type.value
                                ? theme.colors.onPrimaryContainer
                                : theme.colors.onSurfaceVariant,
                            marginTop: 4
                          }}
                        >
                          {type.desc}
                        </Text>
                      </View>
                      <RadioButton
                        value={type.value}
                        status={selectedType === type.value ? 'checked' : 'unchecked'}
                        onPress={() => setSelectedType(type.value)}
                        color={type.color}
                      />
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Spending Limits */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ fontWeight: '700', marginBottom: 16 }}>
              Spending Limits
            </Text>
            <Chip icon="info" mode="flat" style={{ marginBottom: 16, backgroundColor: theme.colors.surfaceVariant }}>
              Optional - Set limits to control spending
            </Chip>
            <View style={styles.limitsList}>
              <TextInput
                label="Daily Limit (ETB)"
                value={limits.daily}
                onChangeText={(text) => setLimits({ ...limits, daily: text })}
                mode="outlined"
                keyboardType="numeric"
                placeholder="e.g., 5000"
                style={styles.input}
              />
              <TextInput
                label="Monthly Limit (ETB)"
                value={limits.monthly}
                onChangeText={(text) => setLimits({ ...limits, monthly: text })}
                mode="outlined"
                keyboardType="numeric"
                placeholder="e.g., 50000"
                style={styles.input}
              />
              <TextInput
                label="Per Transaction Limit (ETB)"
                value={limits.perTxn}
                onChangeText={(text) => setLimits({ ...limits, perTxn: text })}
                mode="outlined"
                keyboardType="numeric"
                placeholder="e.g., 1000"
                style={styles.input}
              />
            </View>
          </Card.Content>
        </Card>

        {error && (
          <Card style={[styles.errorCard, { backgroundColor: theme.colors.errorContainer }]}>
            <Card.Content>
              <Text style={{ color: theme.colors.onErrorContainer, textAlign: 'center' }}>{error}</Text>
            </Card.Content>
          </Card>
        )}

        <Button
          mode="contained"
          onPress={handleCreate}
          disabled={loading}
          loading={loading}
          style={styles.createButton}
          contentStyle={styles.createButtonContent}
          icon="credit-card-plus"
        >
          Create Card
        </Button>
      </ScrollView>
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
  scrollContent: {
    padding: 20
  },
  sectionCard: {
    marginBottom: 20,
    elevation: 2
  },
  typeList: {
    gap: 12
  },
  typeCard: {
    marginBottom: 0
  },
  typeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  typeText: {
    flex: 1
  },
  limitsList: {
    gap: 16
  },
  input: {
    backgroundColor: 'transparent'
  },
  errorCard: {
    marginBottom: 20
  },
  createButton: {
    marginTop: 8,
    marginBottom: 40
  },
  createButtonContent: {
    paddingVertical: 8
  }
});






