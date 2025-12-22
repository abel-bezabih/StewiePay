import React, { useEffect, useState } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { useTheme } from '../theme';
import { TopUpAPI } from '../api/client';

export const TopUpScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const [amount, setAmount] = useState('10000');
  const [reference, setReference] = useState('demo-topup');
  const [topups, setTopups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
    await TopUpAPI.initiate({ amount: Number(amount), currency: 'ETB', reference });
    await load();
  };

  const verify = async (id: string) => {
    await TopUpAPI.verify({ topUpId: id });
    await load();
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
          <TouchableOpacity onPress={() => verify(item.id)}>
            <Text>
              {item.amount} {item.currency} — {item.status}
            </Text>
            <Text variant="muted">{item.reference}</Text>
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
  }
});












