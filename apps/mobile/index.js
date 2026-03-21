import { registerRootComponent } from 'expo';
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

let App = null;
let bootstrapError = null;

try {
  require('react-native-gesture-handler');
} catch (error) {
  bootstrapError = error instanceof Error ? (error.stack || error.message) : String(error);
  console.error('[Bootstrap] Failed to load gesture handler:', bootstrapError);
}

try {
  if (!bootstrapError) {
    App = require('./App').default;
  } else {
    App = null;
  }
} catch (error) {
  const message = error instanceof Error ? (error.stack || error.message) : String(error);
  console.error('[Bootstrap] Failed to load App:', message);
  App = () => (
    <View style={styles.container}>
      <Text style={styles.title}>App failed to load</Text>
      <ScrollView style={styles.scroll}>
        <Text style={styles.error}>{bootstrapError ? `${bootstrapError}\n\n${message}` : message}</Text>
      </ScrollView>
    </View>
  );
}

if (!App) {
  const message = bootstrapError || 'Unknown bootstrap error';
  App = () => (
    <View style={styles.container}>
      <Text style={styles.title}>App failed to load</Text>
      <ScrollView style={styles.scroll}>
        <Text style={styles.error}>{message}</Text>
      </ScrollView>
    </View>
  );
}

registerRootComponent(App);

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

















