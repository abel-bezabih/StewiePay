import React, { useEffect, useState } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, RefreshControl, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { useTheme } from '../theme';
import { TopUpAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export const TopUpScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [amount, setAmount] = useState('10000');
  const [reference, setReference] = useState('demo-topup');
  const [topups, setTopups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTopUpId, setExpandedTopUpId] = useState<string | null>(null);
  const [reconciliationByTopUp, setReconciliationByTopUp] = useState<Record<string, any>>({});
  const [reconLoadingTopUpId, setReconLoadingTopUpId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await TopUpAPI.list();
      setTopups(resp.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const initiate = async () => {
    const kycStatus = (user as any)?.kycStatus || 'PENDING';
    if (kycStatus !== 'VERIFIED') {
      const message =
        kycStatus === 'SUBMITTED'
          ? 'Your KYC is under review. Top-up will unlock after approval.'
          : kycStatus === 'REJECTED'
            ? `KYC rejected: ${(user as any)?.kycRejectionReason || 'Please resubmit to continue.'}`
            : 'Please complete KYC to top up your account.';
      Alert.alert('KYC required', message, [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open KYC', onPress: () => navigation.navigate('KycVerification') }
      ]);
      return;
    }
    await TopUpAPI.initiate({ amount: Number(amount), currency: 'ETB', reference });
    await load();
  };

  const verify = async (id: string) => {
    await TopUpAPI.verify({ topUpId: id });
    await load();
  };

  const loadReconciliation = async (topUpId: string) => {
    setReconLoadingTopUpId(topUpId);
    try {
      const resp = await TopUpAPI.reconciliation(topUpId);
      setReconciliationByTopUp((prev) => ({ ...prev, [topUpId]: resp.data }));
    } catch (error) {
      console.error('Failed to load top-up reconciliation:', error);
    } finally {
      setReconLoadingTopUpId(null);
    }
  };

  const toggleReconciliation = async (topUpId: string) => {
    const next = expandedTopUpId === topUpId ? null : topUpId;
    setExpandedTopUpId(next);
    if (next && !reconciliationByTopUp[topUpId]) {
      await loadReconciliation(topUpId);
    }
  };

  const getFundingStateColor = (state?: string) => {
    switch (state) {
      case 'CARD_LOADED':
        return colors.success as string;
      case 'FAILED':
        return colors.danger as string;
      case 'ISSUER_PENDING':
      case 'PSP_CONFIRMED':
      case 'PSP_PENDING':
        return '#F59E0B';
      default:
        return colors.muted as string;
    }
  };

  const getFundingStateLabel = (state?: string) => {
    switch (state) {
      case 'PSP_PENDING':
        return 'PSP pending';
      case 'PSP_CONFIRMED':
        return 'PSP confirmed';
      case 'ISSUER_PENDING':
        return 'Issuer processing';
      case 'CARD_LOADED':
        return 'Card loaded';
      case 'FAILED':
        return 'Settlement failed';
      default:
        return state || 'Unknown';
    }
  };

  return (
    <Screen>
      <Text variant="title">Top up</Text>
      <View style={{ gap: spacing(2), marginTop: spacing(3) }}>
        <TextInput
          placeholder="Amount"
          placeholderTextColor={colors.muted as string}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          style={[styles.input, { borderColor: colors.border, color: colors.text, borderRadius: radius.md }]}
        />
        <TextInput
          placeholder="Reference"
          placeholderTextColor={colors.muted as string}
          value={reference}
          onChangeText={setReference}
          style={[styles.input, { borderColor: colors.border, color: colors.text, borderRadius: radius.md }]}
        />
        <TouchableOpacity
          onPress={initiate}
          style={{
            backgroundColor: colors.accent,
            padding: spacing(3),
            borderRadius: radius.lg,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: '#0b1224', fontWeight: '700' }}>Initiate top up</Text>
        </TouchableOpacity>
      </View>

      <Text variant="subtitle" style={{ marginTop: spacing(4) }}>
        History
      </Text>
      <FlatList
        style={{ marginTop: spacing(2) }}
        data={topups}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing(3) }} />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => toggleReconciliation(item.id)} activeOpacity={0.8}>
            <Text>
              {item.amount} {item.currency} — {item.status}
            </Text>
            <Text variant="muted">{item.reference}</Text>
            <Text variant="muted" style={{ color: getFundingStateColor(item.fundingState), marginTop: 2 }}>
              {getFundingStateLabel(item.fundingState)}
            </Text>
            {expandedTopUpId === item.id && (
              <View style={[styles.reconciliationBox, { borderColor: colors.border as string }]}>
                {reconLoadingTopUpId === item.id ? (
                  <Text variant="muted">Loading settlement timeline...</Text>
                ) : (
                  <>
                    {(reconciliationByTopUp[item.id]?.events || []).length === 0 ? (
                      <Text variant="muted">No settlement events yet.</Text>
                    ) : (
                      (reconciliationByTopUp[item.id]?.events || []).map((event: any) => (
                        <View key={event.id} style={styles.reconciliationRow}>
                          <Text>
                            {getFundingStateLabel(event.toState)} • {event.source}
                          </Text>
                          <Text variant="muted">{new Date(event.createdAt).toLocaleString()}</Text>
                        </View>
                      ))
                    )}
                    {item.status === 'PENDING' && (
                      <TouchableOpacity onPress={() => verify(item.id)} style={styles.verifyButton}>
                        <Text style={{ color: '#0b1224', fontWeight: '700' }}>Verify now</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loading ? <Text variant="muted">No top ups yet.</Text> : null}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    padding: 12
  },
  reconciliationBox: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8
  },
  reconciliationRow: {
    marginBottom: 8
  },
  verifyButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#60A5FA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  }
});




















