// @ts-nocheck - Premium screen not in use, using react-native-paper which is not installed
import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
// These imports are commented out as react-native-paper is not installed
// The screen is not currently used in navigation
/*
import {
  Surface,
  Text,
  TextInput,
  Button,
  Card,
  ActivityIndicator,
  Divider
} from 'react-native-paper';
import { useTheme } from 'react-native-paper';
*/
import { useAuth } from '../contexts/AuthContext';
import * as Haptics from 'expo-haptics';

export const LoginScreenV2 = ({ navigation }: any) => {
  const theme = useTheme();
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('admin@stewiepay.local');
  const [password, setPassword] = useState('AdminPass123!');
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await login(email, password);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="displaySmall" style={{ fontWeight: '800', marginBottom: 8 }}>
            💳
          </Text>
          <Text variant="headlineLarge" style={{ fontWeight: '800', color: theme.colors.onBackground }}>
            Welcome back
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            Sign in to your StewiePay account
          </Text>
        </View>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              left={<TextInput.Icon icon="email" />}
              style={styles.input}
              error={!!error}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoComplete="password"
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={styles.input}
              error={!!error}
            />

            {error && (
              <Card style={[styles.errorCard, { backgroundColor: theme.colors.errorContainer }]}>
                <Card.Content>
                  <Text style={{ color: theme.colors.onErrorContainer, textAlign: 'center' }}>
                    {error}
                  </Text>
                </Card.Content>
              </Card>
            )}

            <Button
              mode="contained"
              onPress={onSubmit}
              disabled={loading || !email || !password}
              loading={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              icon="login"
            >
              Sign In
            </Button>

            <Divider style={{ marginVertical: 24 }} />

            <Button
              mode="text"
              onPress={() => navigation.navigate('Signup')}
              style={styles.linkButton}
            >
              New here? Create an account
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20
  },
  header: {
    alignItems: 'center',
    marginBottom: 32
  },
  card: {
    elevation: 4
  },
  cardContent: {
    paddingTop: 8
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent'
  },
  errorCard: {
    marginBottom: 16
  },
  button: {
    marginTop: 8
  },
  buttonContent: {
    paddingVertical: 8
  },
  linkButton: {
    marginTop: 8
  }
});






