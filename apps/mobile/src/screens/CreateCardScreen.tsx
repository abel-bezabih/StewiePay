import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { useTheme } from '../theme';
import { CardsAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import * as Haptics from 'expo-haptics';

const CARD_TYPES = [
  { value: 'PERMANENT', label: 'Permanent', icon: '💳', desc: 'Your everyday spending card' },
  { value: 'BURNER', label: 'Burner', icon: '🔥', desc: 'One-time use, auto-closes after first transaction' },
  { value: 'MERCHANT_LOCKED', label: 'Merchant Locked', icon: '🔒', desc: 'Only works at specific merchants' },
  { value: 'SUBSCRIPTION_ONLY', label: 'Subscription Only', icon: '🔄', desc: 'For recurring subscriptions only' },
  { value: 'ADS_ONLY', label: 'Ads Only', icon: '📢', desc: 'For advertising spend (Meta, Google, etc.)' }
];

export const CreateCardScreen = ({ navigation, route }: any) => {
  const { colors, spacing, radius } = useTheme();
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState('PERMANENT');
  const [limits, setLimits] = useState({ daily: '', monthly: '', perTxn: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const orgId = route?.params?.orgId;

  const handleCreate = async () => {
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

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text variant="title" style={{ fontSize: 28, marginBottom: spacing(2) }}>
          Create New Card
        </Text>
        <Text variant="muted" style={{ marginBottom: spacing(6) }}>
          Choose card type and set spending limits
        </Text>

        {/* Card Type Selection */}
        <Text variant="subtitle" style={{ marginBottom: spacing(3) }}>
          Card Type
        </Text>
        <View style={{ gap: spacing(2), marginBottom: spacing(6) }}>
          {CARD_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedType(type.value);
              }}
              style={[
                styles.typeOption,
                {
                  backgroundColor: colors.card,
                  borderColor: selectedType === type.value ? colors.accent : colors.border,
                  borderWidth: selectedType === type.value ? 2 : 1,
                  borderRadius: radius.md,
                  padding: spacing(4)
                }
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 32, marginRight: spacing(3) }}>{type.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text variant="subtitle" style={{ marginBottom: spacing(1) }}>
                    {type.label}
                  </Text>
                  <Text variant="muted" style={{ fontSize: 12 }}>
                    {type.desc}
                  </Text>
                </View>
                {selectedType === type.value && (
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: colors.accent,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Text style={{ color: '#0B1224', fontSize: 16, fontWeight: '700' }}>✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Spending Limits */}
        <Text variant="subtitle" style={{ marginBottom: spacing(3) }}>
          Spending Limits (Optional)
        </Text>
        <View style={{ gap: spacing(3), marginBottom: spacing(6) }}>
          <LimitInput
            label="Daily Limit (ETB)"
            value={limits.daily}
            onChangeText={(text) => setLimits({ ...limits, daily: text })}
            placeholder="e.g., 5000"
          />
          <LimitInput
            label="Monthly Limit (ETB)"
            value={limits.monthly}
            onChangeText={(text) => setLimits({ ...limits, monthly: text })}
            placeholder="e.g., 50000"
          />
          <LimitInput
            label="Per Transaction Limit (ETB)"
            value={limits.perTxn}
            onChangeText={(text) => setLimits({ ...limits, perTxn: text })}
            placeholder="e.g., 1000"
          />
        </View>

        {error && (
          <Text style={{ color: colors.danger, marginBottom: spacing(4), textAlign: 'center' }}>
            {error}
          </Text>
        )}

        <TouchableOpacity
          onPress={handleCreate}
          disabled={loading}
          style={[
            styles.createButton,
            {
              backgroundColor: colors.accent,
              borderRadius: radius.lg,
              padding: spacing(4),
              alignItems: 'center',
              marginBottom: spacing(6),
              opacity: loading ? 0.6 : 1
            }
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#0B1224" />
          ) : (
            <Text style={{ color: '#0B1224', fontWeight: '700', fontSize: 16 }}>
              Create Card
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
};

const LimitInput = ({
  label,
  value,
  onChangeText,
  placeholder
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}) => {
  const { colors, spacing, radius } = useTheme();
  return (
    <View>
      <Text variant="muted" style={{ fontSize: 12, marginBottom: spacing(1) }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted as string}
        keyboardType="numeric"
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.text,
            borderRadius: radius.md,
            padding: spacing(3)
          }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  typeOption: {
    minHeight: 80
  },
  input: {
    borderWidth: 1,
    fontSize: 16
  },
  createButton: {
    justifyContent: 'center'
  }
});















