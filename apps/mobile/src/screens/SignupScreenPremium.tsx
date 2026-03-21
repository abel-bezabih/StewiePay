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
  Divider,
  Checkbox
} from 'react-native-paper';
import { useTheme } from 'react-native-paper';
*/
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';

export const SignupScreenPremium = ({ navigation }: any) => {
  const theme = useTheme();
  const { signup, loading, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const onSubmit = async () => {
    if (!isValidEmail(email)) {
      return;
    }
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
  const emailValid = email ? isValidEmail(email) : false;
  const canSubmit = name && emailValid && password && passwordsMatch && agreeToTerms;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Header */}
        <LinearGradient
          colors={['#F093FB', '#F5576C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Animatable.View animation="fadeInDown" duration={600}>
            <Text variant="displaySmall" style={styles.headerEmoji}>
              🚀
            </Text>
            <Text variant="headlineLarge" style={styles.headerTitle}>
              Start your journey
            </Text>
            <Text variant="bodyLarge" style={styles.headerSubtitle}>
              Take control of your spending today
            </Text>
          </Animatable.View>
        </LinearGradient>

        {/* Signup Form */}
        <Animatable.View animation="fadeInUp" delay={200} duration={600}>
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleLarge" style={styles.formTitle}>
                Create your account
              </Text>
              <Text variant="bodyMedium" style={[styles.formSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Join thousands taking control of their finances
              </Text>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Full Name"
                  value={name}
                  onChangeText={setName}
                  mode="outlined"
                  autoCapitalize="words"
                  left={<TextInput.Icon icon="account" />}
                  style={styles.input}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
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
                  error={!!error || (email && !emailValid)}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                />
                {email && !emailValid && (
                  <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                    Enter a valid email (example: name@gmail.com).
                  </Text>
                )}

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
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
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
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                />

                {error && (
                  <Animatable.View animation="shake" duration={500}>
                    <Card style={[styles.errorCard, { backgroundColor: theme.colors.errorContainer }]}>
                      <Card.Content>
                        <Text style={{ color: theme.colors.onErrorContainer, textAlign: 'center' }}>
                          {error}
                        </Text>
                      </Card.Content>
                    </Card>
                  </Animatable.View>
                )}

                <View style={styles.checkboxContainer}>
                  <Checkbox
                    status={agreeToTerms ? 'checked' : 'unchecked'}
                    onPress={() => setAgreeToTerms(!agreeToTerms)}
                    color={theme.colors.primary}
                  />
                  <Text
                    variant="bodySmall"
                    style={{ flex: 1, color: theme.colors.onSurfaceVariant }}
                    onPress={() => setAgreeToTerms(!agreeToTerms)}
                  >
                    I agree to the{' '}
                    <Text style={{ color: theme.colors.primary }}>Terms of Service</Text>
                    {' '}and{' '}
                    <Text style={{ color: theme.colors.primary }}>Privacy Policy</Text>
                  </Text>
                </View>

                <Button
                  mode="contained"
                  onPress={onSubmit}
                  disabled={loading || !canSubmit}
                  loading={loading}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                  icon="account-plus"
                >
                  Create Account
                </Button>
              </View>

              <Divider style={{ marginVertical: 24 }} />

              <View style={styles.footer}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Already have an account?{' '}
                </Text>
                <Button
                  mode="text"
                  onPress={() => navigation.navigate('Login')}
                  labelStyle={{ color: theme.colors.primary }}
                >
                  Sign in
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Animatable.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1
  },
  header: {
    padding: 40,
    paddingTop: 80,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center'
  },
  headerEmoji: {
    fontSize: 80,
    marginBottom: 16,
    textAlign: 'center'
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center'
  },
  card: {
    margin: 20,
    marginTop: -20,
    elevation: 8,
    borderRadius: 24
  },
  cardContent: {
    paddingTop: 8
  },
  formTitle: {
    fontWeight: '700',
    marginBottom: 8
  },
  formSubtitle: {
    marginBottom: 24
  },
  inputContainer: {
    gap: 16
  },
  input: {
    backgroundColor: 'transparent'
  },
  errorCard: {
    marginTop: 8
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  button: {
    marginTop: 16,
    borderRadius: 16
  },
  buttonContent: {
    paddingVertical: 8
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  }
});






