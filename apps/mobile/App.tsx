import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

let AppRoot: React.ComponentType | null = null;
let loadError: string | null = null;

try {
  AppRoot = require('./src/AppRoot').default;
} catch (error) {
  loadError = error instanceof Error ? (error.stack || error.message) : String(error);
  console.error('[App] Failed to load AppRoot:', loadError);
}

export default function App() {
  if (!AppRoot) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>App failed to load</Text>
        <ScrollView style={styles.scroll}>
          <Text style={styles.error}>{loadError || 'Unknown error'}</Text>
        </ScrollView>
      </View>
    );
  }
  return <AppRoot />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
    paddingTop: 48,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  scroll: {
    flex: 1,
  },
  error: {
    color: '#ff6b6b',
    fontSize: 12,
  },
});


