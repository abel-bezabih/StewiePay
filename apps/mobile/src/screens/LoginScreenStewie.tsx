import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieCard } from '../components/stewiepay/StewieCard';
import { StewieText } from '../components/stewiepay/StewieText';
import { StewieButton } from '../components/stewiepay/StewieButton';
import { Ionicons } from '@expo/vector-icons';

export const LoginScreenStewie = ({ navigation }: any) => {
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* StewiePay Header */}
        <LinearGradient
          colors={StewiePayBrand.colors.gradients.primary as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Animatable.View animation="fadeInDown" duration={600}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="card-outline" size={64} color="#FFFFFF" />
            </View>
            <StewieText variant="headlineLarge" color="primary" weight="black" style={styles.headerTitle}>
              StewiePay
            </StewieText>
            <StewieText variant="bodyLarge" color="primary" style={styles.headerSubtitle}>
              Sign in to your account
            </StewieText>
          </Animatable.View>
        </LinearGradient>

        {/* Login Form */}
        <Animatable.View animation="fadeInUp" delay={200} duration={600} style={styles.formContainer}>
          <StewieCard elevated style={styles.card}>
            <StewieText variant="titleLarge" color="primary" weight="bold" style={styles.formTitle}>
              Sign in to continue
            </StewieText>
            <StewieText variant="bodyMedium" color="muted" style={styles.formSubtitle}>
              Enter your credentials to access your account
            </StewieText>

            <View style={styles.inputContainer}>
              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <StewieText variant="labelMedium" color="muted" style={styles.inputLabel}>
                  Email
                </StewieText>
                <View style={styles.inputBox}>
                  <Ionicons name="mail-outline" size={20} color={StewiePayBrand.colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter your email"
                    placeholderTextColor={StewiePayBrand.colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <StewieText variant="labelMedium" color="muted" style={styles.inputLabel}>
                  Password
                </StewieText>
                <View style={styles.inputBox}>
                  <Ionicons name="lock-closed-outline" size={20} color={StewiePayBrand.colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter your password"
                    placeholderTextColor={StewiePayBrand.colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    style={styles.input}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowPassword(!showPassword);
                    }}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={StewiePayBrand.colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error Message */}
              {error && (
                <Animatable.View animation="shake" duration={500}>
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color={StewiePayBrand.colors.error} />
                    <StewieText variant="bodySmall" color="error" style={styles.errorText}>
                      {error}
                    </StewieText>
                  </View>
                </Animatable.View>
              )}

              {/* Login Button */}
              <StewieButton
                label={loading ? 'Signing in...' : 'Sign in'}
                onPress={onSubmit}
                variant="primary"
                size="lg"
                loading={loading}
                disabled={loading || !email || !password}
                fullWidth
                style={styles.loginButton}
              />

              {/* Sign Up Link */}
              <View style={styles.signupContainer}>
                <StewieText variant="bodyMedium" color="muted">
                  Don't have an account?{' '}
                </StewieText>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('Signup');
                  }}
                >
                  <StewieText variant="bodyMedium" color="brand" weight="semibold">
                    Sign up
                  </StewieText>
                </TouchableOpacity>
              </View>
            </View>
          </StewieCard>
        </Animatable.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: StewiePayBrand.colors.backgroundSecondary, // Gray background
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 80,
    paddingBottom: StewiePayBrand.spacing['3xl'],
    paddingHorizontal: StewiePayBrand.spacing.md,
    borderBottomLeftRadius: StewiePayBrand.radius['3xl'],
    borderBottomRightRadius: StewiePayBrand.radius['3xl'],
  },
  headerIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: StewiePayBrand.spacing.md,
    alignSelf: 'center',
  },
  headerTitle: {
    textAlign: 'center',
    marginBottom: StewiePayBrand.spacing.sm,
  },
  headerSubtitle: {
    textAlign: 'center',
    opacity: 0.9,
  },
  formContainer: {
    paddingHorizontal: StewiePayBrand.spacing.md,
    marginTop: -StewiePayBrand.spacing['2xl'],
  },
  card: {
    padding: StewiePayBrand.spacing.lg,
  },
  formTitle: {
    marginBottom: StewiePayBrand.spacing.xs,
  },
  formSubtitle: {
    marginBottom: StewiePayBrand.spacing.lg,
  },
  inputContainer: {
    gap: StewiePayBrand.spacing.md,
  },
  inputWrapper: {
    gap: StewiePayBrand.spacing.xs,
  },
  inputLabel: {
    marginBottom: StewiePayBrand.spacing.xs,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: StewiePayBrand.colors.surface,
    borderRadius: StewiePayBrand.radius.md,
    borderWidth: 1,
    borderColor: StewiePayBrand.colors.surfaceVariant,
    paddingHorizontal: StewiePayBrand.spacing.md,
    paddingVertical: StewiePayBrand.spacing.sm,
  },
  inputIcon: {
    marginRight: StewiePayBrand.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: StewiePayBrand.typography.styles.bodyMedium.fontSize,
    fontWeight: StewiePayBrand.typography.styles.bodyMedium.fontWeight as '400' | '500' | '600' | '700' | '800' | '900',
    lineHeight: StewiePayBrand.typography.styles.bodyMedium.lineHeight,
    letterSpacing: StewiePayBrand.typography.styles.bodyMedium.letterSpacing,
    color: StewiePayBrand.colors.textPrimary,
  },
  eyeIcon: {
    padding: StewiePayBrand.spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${StewiePayBrand.colors.error}20`,
    padding: StewiePayBrand.spacing.sm,
    borderRadius: StewiePayBrand.radius.sm,
    gap: StewiePayBrand.spacing.xs,
  },
  errorText: {
    flex: 1,
  },
  loginButton: {
    marginTop: StewiePayBrand.spacing.md,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: StewiePayBrand.spacing.lg,
  },
});

