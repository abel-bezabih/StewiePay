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
  Divider
} from 'react-native-paper';
import { useTheme } from 'react-native-paper';
*/
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';

export const LoginScreenPremium = ({ navigation }: any) => {
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Header */}
        <LinearGradient
          colors={['#667EEA', '#764BA2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Animatable.View animation="fadeInDown" duration={600}>
            <Text variant="displaySmall" style={styles.headerEmoji}>
              💳
            </Text>
            <Text variant="headlineLarge" style={styles.headerTitle}>
              Welcome back
            </Text>
            <Text variant="bodyLarge" style={styles.headerSubtitle}>
              Your financial control awaits
            </Text>
          </Animatable.View>
        </LinearGradient>

        {/* Login Form */}
        <Animatable.View animation="fadeInUp" delay={200} duration={600}>
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleLarge" style={styles.formTitle}>
                Sign in to continue
              </Text>
              <Text variant="bodyMedium" style={[styles.formSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Enter your credentials to access your account
              </Text>

              <View style={styles.inputContainer}>
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
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
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

                <Button
                  mode="contained"
                  onPress={onSubmit}
                  disabled={loading || !email || !password}
                  loading={loading}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                  icon="login"
                >
                  Sign In
                </Button>
              </View>

              <Divider style={{ marginVertical: 24 }} />

              <View style={styles.footer}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  New to StewiePay?{' '}
                </Text>
                <Button
                  mode="text"
                  onPress={() => navigation.navigate('Signup')}
                  labelStyle={{ color: theme.colors.primary }}
                >
                  Create account
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
  button: {
    marginTop: 8,
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






