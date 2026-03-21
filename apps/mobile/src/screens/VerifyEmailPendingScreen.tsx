import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { AuthAPI } from '../api/client';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieCard } from '../components/stewiepay/StewieCard';
import { StewieText } from '../components/stewiepay/StewieText';
import { StewieButton } from '../components/stewiepay/StewieButton';

export const VerifyEmailPendingScreen = ({ route, navigation }: any) => {
  const email = String(route?.params?.email || '').trim();
  const [sending, setSending] = useState(false);

  const openMailApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = 'message://';
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return;
    }
    Alert.alert('Open your email', 'Please open your email app and tap the verification link.');
  };

  const resend = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSending(true);
    try {
      await AuthAPI.resendVerification(email);
      Alert.alert('Email sent', 'We sent a new verification email. Please check your inbox.');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to resend verification email.';
      Alert.alert('Failed', String(msg));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StewieCard elevated style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="mail-unread-outline" size={34} color="#FFFFFF" />
        </View>
        <StewieText variant="titleLarge" color="primary" weight="bold" style={styles.title}>
          Check your email
        </StewieText>
        <StewieText variant="bodyMedium" color="muted" style={styles.subtitle}>
          We sent a verification link to:
        </StewieText>
        <StewieText variant="bodyMedium" color="primary" weight="semibold" style={styles.email}>
          {email || 'your email address'}
        </StewieText>

        <StewieButton
          label="Open email app"
          onPress={openMailApp}
          variant="primary"
          size="lg"
          fullWidth
          style={{ marginTop: StewiePayBrand.spacing.lg }}
        />

        <TouchableOpacity onPress={resend} style={styles.linkBtn} disabled={sending}>
          <StewieText variant="bodyMedium" color="brand" weight="semibold">
            {sending ? 'Resending...' : 'Resend verification email'}
          </StewieText>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkBtn}>
          <StewieText variant="bodyMedium" color="muted">
            Back to login
          </StewieText>
        </TouchableOpacity>
      </StewieCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: StewiePayBrand.spacing.lg,
    backgroundColor: StewiePayBrand.colors.backgroundSecondary
  },
  card: {
    padding: StewiePayBrand.spacing.xl
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: StewiePayBrand.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: StewiePayBrand.spacing.md
  },
  title: {
    textAlign: 'center'
  },
  subtitle: {
    textAlign: 'center',
    marginTop: StewiePayBrand.spacing.sm
  },
  email: {
    textAlign: 'center',
    marginTop: 6
  },
  linkBtn: {
    alignItems: 'center',
    marginTop: StewiePayBrand.spacing.md
  }
});
