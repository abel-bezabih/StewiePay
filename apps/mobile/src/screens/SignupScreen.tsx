import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { useTheme } from '../theme';
import { useAuth } from '../contexts/AuthContext';

export const SignupScreen = ({ navigation }: any) => {
  const { colors, spacing, radius } = useTheme();
  const { signup, loading, error } = useAuth();
  const [name, setName] = useState('New User');
  const [email, setEmail] = useState('user@stewiepay.local');
  const [password, setPassword] = useState('UserPass123!');

  const onSubmit = async () => {
    const success = await signup(name, email, password);
    if (success) {
      // Navigation will happen automatically via RequireAuth
    }
  };

  return (
    <Screen style={{ justifyContent: 'center' }}>
      <Text variant="title">Create account</Text>
      <Text variant="muted" style={{ marginTop: spacing(2) }}>
        Join StewiePay to control spend like Revolut/Wise.
      </Text>
      <View style={{ marginTop: spacing(4), gap: spacing(3) }}>
        <TextInput
          placeholder="Name"
          placeholderTextColor={colors.muted as string}
          style={[styles.input, { borderColor: colors.border, color: colors.text, borderRadius: radius.md }]}
          value={name}
          onChangeText={setName}
        />
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
          {loading ? <ActivityIndicator color="#0b1224" /> : <Text style={{ color: '#0b1224', fontWeight: '700' }}>Create account</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text variant="muted">Have an account? Sign in</Text>
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






