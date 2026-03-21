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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { AuthAPI } from '../api/client';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieCard } from '../components/stewiepay/StewieCard';
import { StewieText } from '../components/stewiepay/StewieText';
import { StewieButton } from '../components/stewiepay/StewieButton';
import { Ionicons } from '@expo/vector-icons';

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const response = await AuthAPI.forgotPassword(email);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // In development, show the token if provided
      if (__DEV__ && response.data?.resetToken) {
        Alert.alert(
          'Reset Token (Dev Mode)',
          `Token: ${response.data.resetToken}\n\nUse this token in the Reset Password screen.`,
          [{ text: 'OK' }]
        );
      }
      
      setEmailSent(true);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to send reset email. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={StewiePayBrand.colors.gradients.primary as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Animatable.View animation="fadeInDown" duration={600}>
              <View style={styles.headerIconContainer}>
                <Ionicons name="mail-outline" size={64} color="#FFFFFF" />
              </View>
              <StewieText variant="headlineLarge" color="primary" weight="black" style={styles.headerTitle}>
                Check Your Email
              </StewieText>
              <StewieText variant="bodyLarge" color="primary" style={styles.headerSubtitle}>
                We've sent password reset instructions
              </StewieText>
            </Animatable.View>
          </LinearGradient>

          <Animatable.View animation="fadeInUp" delay={200} duration={600} style={styles.formContainer}>
            <StewieCard elevated style={styles.card}>
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={80} color={StewiePayBrand.colors.success} style={styles.successIcon} />
                <StewieText variant="titleLarge" color="primary" weight="bold" style={styles.successTitle}>
                  Email Sent!
                </StewieText>
                <StewieText variant="bodyMedium" color="muted" style={styles.successMessage}>
                  We've sent password reset instructions to {email}. Please check your inbox and follow the link to reset your password.
                </StewieText>
                <StewieText variant="bodySmall" color="muted" style={styles.successNote}>
                  Didn't receive the email? Check your spam folder or try again.
                </StewieText>
              </View>

              <View style={styles.actions}>
                <StewieButton
                  label="Back to Login"
                  onPress={() => navigation.goBack()}
                  variant="secondary"
                  fullWidth
                />
                <TouchableOpacity
                  onPress={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                  style={styles.resendButton}
                >
                  <StewieText variant="bodyMedium" color="brand" weight="semibold">
                    Resend Email
                  </StewieText>
                </TouchableOpacity>
              </View>
            </StewieCard>
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={StewiePayBrand.colors.gradients.primary as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Animatable.View animation="fadeInDown" duration={600}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerIconContainer}>
              <Ionicons name="lock-closed-outline" size={64} color="#FFFFFF" />
            </View>
            <StewieText variant="headlineLarge" color="primary" weight="black" style={styles.headerTitle}>
              Forgot Password?
            </StewieText>
            <StewieText variant="bodyLarge" color="primary" style={styles.headerSubtitle}>
              Enter your email to reset your password
            </StewieText>
          </Animatable.View>
        </LinearGradient>

        <Animatable.View animation="fadeInUp" delay={200} duration={600} style={styles.formContainer}>
          <StewieCard elevated style={styles.card}>
            <StewieText variant="titleLarge" color="primary" weight="bold" style={styles.formTitle}>
              Reset Password
            </StewieText>
            <StewieText variant="bodyMedium" color="muted" style={styles.formSubtitle}>
              We'll send you a link to reset your password
            </StewieText>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <StewieText variant="labelMedium" color="muted" style={styles.inputLabel}>
                  Email Address
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
            </View>

            <View style={styles.actions}>
              <StewieButton
                label={loading ? 'Sending...' : 'Send Reset Link'}
                onPress={handleForgotPassword}
                fullWidth
                disabled={loading}
                loading={loading}
              />
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backToLoginButton}
              >
                <StewieText variant="bodyMedium" color="muted">
                  Remember your password? <StewieText variant="bodyMedium" color="brand" weight="semibold">Sign in</StewieText>
                </StewieText>
              </TouchableOpacity>
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
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    paddingHorizontal: StewiePayBrand.spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: StewiePayBrand.spacing.lg,
    zIndex: 10,
    padding: StewiePayBrand.spacing.sm,
  },
  headerIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: StewiePayBrand.spacing.lg,
  },
  headerTitle: {
    textAlign: 'center',
    marginBottom: StewiePayBrand.spacing.sm,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  formContainer: {
    flex: 1,
    padding: StewiePayBrand.spacing.lg,
    paddingTop: StewiePayBrand.spacing.xl,
  },
  card: {
    padding: StewiePayBrand.spacing.xl,
  },
  formTitle: {
    marginBottom: StewiePayBrand.spacing.xs,
    textAlign: 'center',
  },
  formSubtitle: {
    marginBottom: StewiePayBrand.spacing.xl,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: StewiePayBrand.spacing.xl,
  },
  inputWrapper: {
    marginBottom: StewiePayBrand.spacing.lg,
  },
  inputLabel: {
    marginBottom: StewiePayBrand.spacing.sm,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: StewiePayBrand.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: StewiePayBrand.spacing.md,
    height: 56,
  },
  inputIcon: {
    marginRight: StewiePayBrand.spacing.sm,
  },
  input: {
    flex: 1,
    color: StewiePayBrand.colors.textPrimary,
    fontSize: 16,
  },
  actions: {
    gap: StewiePayBrand.spacing.md,
  },
  backToLoginButton: {
    alignItems: 'center',
    paddingVertical: StewiePayBrand.spacing.sm,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: StewiePayBrand.spacing.xl,
  },
  successIcon: {
    marginBottom: StewiePayBrand.spacing.lg,
  },
  successTitle: {
    marginBottom: StewiePayBrand.spacing.md,
    textAlign: 'center',
  },
  successMessage: {
    textAlign: 'center',
    marginBottom: StewiePayBrand.spacing.md,
    paddingHorizontal: StewiePayBrand.spacing.md,
  },
  successNote: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: StewiePayBrand.spacing.xl,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: StewiePayBrand.spacing.sm,
  },
});








