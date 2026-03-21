import React, { useEffect, useState } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { useTheme } from '../theme';
import { TransactionsAPI } from '../api/client';

export const TransactionsScreen = () => {
  const { spacing } = useTheme();
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await TransactionsAPI.list();
      setTxns(resp.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Screen>
      <Text variant="title">Transactions</Text>
      <FlatList
        style={{ marginTop: spacing(3) }}
        data={txns}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing(3) }} />}
        renderItem={({ item }) => (
          <View>
            <Text>{item.merchantName}</Text>
            <Text variant="muted">
              {item.amount} {item.currency} • {item.status}
            </Text>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text variant="muted">No transactions yet.</Text> : null}
      />
    </Screen>
  );
};




















