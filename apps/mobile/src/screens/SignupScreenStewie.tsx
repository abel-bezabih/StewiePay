import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
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

export const SignupScreenStewie = ({ navigation }: any) => {
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* StewiePay Header */}
        <LinearGradient
          colors={StewiePayBrand.colors.gradients.accent as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Animatable.View animation="fadeInDown" duration={600}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#FFFFFF" />
            </View>
            <StewieText variant="headlineLarge" color="primary" weight="black" style={styles.headerTitle}>
              StewiePay
            </StewieText>
            <StewieText variant="bodyLarge" color="primary" style={styles.headerSubtitle}>
              Create your account
            </StewieText>
          </Animatable.View>
        </LinearGradient>

        {/* Signup Form */}
        <Animatable.View animation="fadeInUp" delay={200} duration={600} style={styles.formContainer}>
          <StewieCard elevated style={styles.card}>
            <StewieText variant="titleLarge" color="primary" weight="bold" style={styles.formTitle}>
              Account details
            </StewieText>

            <View style={styles.inputContainer}>
              {/* Name Input */}
              <View style={styles.inputWrapper}>
                <StewieText variant="labelMedium" color="muted" style={styles.inputLabel}>
                  Full Name
                </StewieText>
                <View style={styles.inputBox}>
                  <Ionicons name="person-outline" size={20} color={StewiePayBrand.colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter your full name"
                    placeholderTextColor={StewiePayBrand.colors.textMuted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    style={styles.input}
                  />
                </View>
              </View>

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
                    placeholder="Create a password"
                    placeholderTextColor={StewiePayBrand.colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password-new"
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

              {/* Confirm Password Input */}
              <View style={styles.inputWrapper}>
                <StewieText variant="labelMedium" color="muted" style={styles.inputLabel}>
                  Confirm Password
                </StewieText>
                <View
                  style={[
                    styles.inputBox,
                    confirmPassword && !passwordsMatch && styles.inputBoxError,
                    confirmPassword && passwordsMatch && styles.inputBoxSuccess,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={
                      confirmPassword && !passwordsMatch
                        ? StewiePayBrand.colors.error
                        : confirmPassword && passwordsMatch
                        ? StewiePayBrand.colors.success
                        : StewiePayBrand.colors.textMuted
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Confirm your password"
                    placeholderTextColor={StewiePayBrand.colors.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="password-new"
                    style={styles.input}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowConfirmPassword(!showConfirmPassword);
                    }}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={StewiePayBrand.colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                {confirmPassword && !passwordsMatch && (
                  <StewieText variant="bodySmall" color="error" style={styles.validationText}>
                    Passwords do not match
                  </StewieText>
                )}
                {confirmPassword && passwordsMatch && (
                  <StewieText variant="bodySmall" color="success" style={styles.validationText}>
                    Passwords match
                  </StewieText>
                )}
              </View>

              {/* Terms Checkbox */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAgreeToTerms(!agreeToTerms);
                }}
              >
                <View
                  style={[
                    styles.checkbox,
                    agreeToTerms && styles.checkboxChecked,
                  ]}
                >
                  {agreeToTerms && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
                <StewieText variant="bodySmall" color="muted" style={styles.checkboxLabel}>
                  I agree to the Terms of Service and Privacy Policy
                </StewieText>
              </TouchableOpacity>

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

              {/* Sign Up Button */}
              <StewieButton
                label={loading ? 'Creating...' : 'Create account'}
                onPress={onSubmit}
                variant="primary"
                size="lg"
                loading={loading}
                disabled={!canSubmit || loading}
                fullWidth
                style={styles.signupButton}
              />

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <StewieText variant="bodyMedium" color="muted">
                  Already have an account?{' '}
                </StewieText>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('Login');
                  }}
                >
                  <StewieText variant="bodyMedium" color="brand" weight="semibold">
                    Sign in
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
  inputBoxError: {
    borderColor: StewiePayBrand.colors.error,
  },
  inputBoxSuccess: {
    borderColor: StewiePayBrand.colors.success,
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
  validationText: {
    marginTop: StewiePayBrand.spacing.xs,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: StewiePayBrand.spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: StewiePayBrand.radius.xs,
    borderWidth: 2,
    borderColor: StewiePayBrand.colors.surfaceVariant,
    marginRight: StewiePayBrand.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: StewiePayBrand.colors.primary,
    borderColor: StewiePayBrand.colors.primary,
  },
  checkboxLabel: {
    flex: 1,
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
  signupButton: {
    marginTop: StewiePayBrand.spacing.md,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: StewiePayBrand.spacing.lg,
  },
});

