import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import {
  Surface,
  Text,
  TextInput,
  Button,
  Card,
  ActivityIndicator,
  Divider,
  Checkbox
} from 'react-native';
import { useTheme } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import * as Haptics from 'expo-haptics';

export const SignupScreenV2 = ({ navigation }: any) => {
  const theme = useTheme();
  const { signup, loading, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const onSubmit = async () => {
    if (password !== confirmPassword) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await signup(name, email, password);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const canSubmit = name && email && password && passwordsMatch && agreeToTerms;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text  style={{ fontWeight: '800', marginBottom: 8 }}>
            🚀
          </Text>
          <Text  style={{ fontWeight: '800', color: theme.colors.onBackground }}>
            Create account
          </Text>
          <Text  style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            Start controlling your spend today
          </Text>
        </View>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <TextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              autoCapitalize="words"
              left={<TextInput.Icon icon="account" />}
              style={styles.input}
            />

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
              autoComplete="password-new"
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

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              autoComplete="password-new"
              left={<TextInput.Icon icon="lock-check" />}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
              style={styles.input}
              error={!!error || (confirmPassword && !passwordsMatch)}
              helperText={
                confirmPassword && !passwordsMatch ? 'Passwords do not match' : undefined
              }
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

            <View style={styles.checkboxContainer}>
              <Checkbox
                status={agreeToTerms ? 'checked' : 'unchecked'}
                onPress={() => setAgreeToTerms(!agreeToTerms)}
              />
              <Text
                
                style={{ flex: 1, color: theme.colors.onSurfaceVariant }}
                onPress={() => setAgreeToTerms(!agreeToTerms)}
              >
                I agree to the Terms of Service and Privacy Policy
              </Text>
            </View>

            <Button
              mode="contained"
              onPress={onSubmit}
              disabled={loading || !canSubmit}
              loading={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              icon="account-plus"
            >
              Create Account
            </Button>

            <Divider style={{ marginVertical: 24 }} />

            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={styles.linkButton}
            >
              Already have an account? Sign in
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8
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







