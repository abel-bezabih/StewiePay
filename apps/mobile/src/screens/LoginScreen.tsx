import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { useTheme } from '../theme';
import { useAuth } from '../contexts/AuthContext';

export const LoginScreen = ({ navigation }: any) => {
  const { colors, spacing, radius } = useTheme();
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('admin@stewiepay.local');
  const [password, setPassword] = useState('AdminPass123!');

  const onSubmit = async () => {
    const success = await login(email, password);
    if (success) {
      // Navigation will happen automatically via RequireAuth
    }
  };

  return (
    <Screen style={{ justifyContent: 'center' }}>
      <Text variant="title">Welcome back</Text>
      <Text variant="muted" style={{ marginTop: spacing(2) }}>
        Sign in with your StewiePay account
      </Text>
      <View style={{ marginTop: spacing(4), gap: spacing(3) }}>
        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.muted as string}
          autoCapitalize="none"
          style={[styles.input, { borderColor: colors.border, color: colors.text, borderRadius: radius.md }]}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.muted as string}
          secureTextEntry
          style={[styles.input, { borderColor: colors.border, color: colors.text, borderRadius: radius.md }]}
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
        <TouchableOpacity
          onPress={onSubmit}
          style={[
            styles.button,
            { backgroundColor: colors.accent, borderRadius: radius.lg, padding: spacing(3), alignItems: 'center' }
          ]}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#0b1224" /> : <Text style={{ color: '#0b1224', fontWeight: '700' }}>Sign in</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text variant="muted">New here? Create account</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    padding: 12
  },
  button: {}
});






