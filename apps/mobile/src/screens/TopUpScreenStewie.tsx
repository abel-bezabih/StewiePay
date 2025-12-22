import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TopUpAPI } from '../api/client';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieCard } from '../components/stewiepay/StewieCard';
import { StewieText } from '../components/stewiepay/StewieText';
import { StewieButton } from '../components/stewiepay/StewieButton';
import { GlassCard } from '../components/modern/GlassCard';
import { SkeletonLoader, SkeletonCard } from '../components/modern/SkeletonLoader';
import { BackButton } from '../components/navigation/BackButton';
import { ModalTopUpWrapper } from '../components/navigation/ModalTopUpWrapper';
import { Ionicons } from '@expo/vector-icons';

export const TopUpScreenStewie = () => {
  const [amount, setAmount] = useState('10000');
  const [reference, setReference] = useState('demo-topup');
  const [topups, setTopups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await TopUpAPI.list();
      setTopups(resp.data || []);
    } catch (e) {
      console.error('Failed to load top-ups:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const initiate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await TopUpAPI.initiate({ amount: Number(amount), currency: 'ETB', reference });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Failed to initiate top-up:', e);
    }
  };

  const verify = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await TopUpAPI.verify({ topUpId: id });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Failed to verify top-up:', e);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return StewiePayBrand.colors.success;
      case 'PENDING':
        return StewiePayBrand.colors.warning;
      case 'FAILED':
        return StewiePayBrand.colors.error;
      default:
        return StewiePayBrand.colors.textMuted;
    }
  };

  const totalTopUps = topups.reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <ModalTopUpWrapper>
      <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={StewiePayBrand.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* StewiePay Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <StewieText variant="headlineLarge" color="primary" weight="black">
            Top Up
          </StewieText>
          <StewieText variant="bodyMedium" color="muted" style={{ marginTop: StewiePayBrand.spacing.xs }}>
            {topups.length} {topups.length === 1 ? 'top-up' : 'top-ups'} • Total: ETB {totalTopUps.toLocaleString()}
          </StewieText>
        </Animated.View>

        {/* Top-Up Form */}
        <View style={styles.formContainer}>
          <Animated.View entering={FadeInDown.delay(50).duration(400)}>
            <GlassCard elevated intensity={35} style={styles.formCard}>
              <StewieText variant="titleLarge" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.md }}>
                Initiate Top-Up
              </StewieText>

              <View style={styles.inputWrapper}>
                <StewieText variant="labelMedium" color="muted" style={styles.inputLabel}>
                  Amount (ETB)
                </StewieText>
                <View style={styles.inputBox}>
                  <Ionicons name="cash-outline" size={20} color={StewiePayBrand.colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter amount"
                    placeholderTextColor={StewiePayBrand.colors.textMuted}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <StewieText variant="labelMedium" color="muted" style={styles.inputLabel}>
                  Reference
                </StewieText>
                <View style={styles.inputBox}>
                  <Ionicons name="document-text-outline" size={20} color={StewiePayBrand.colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter reference"
                    placeholderTextColor={StewiePayBrand.colors.textMuted}
                    value={reference}
                    onChangeText={setReference}
                    style={styles.input}
                  />
                </View>
              </View>

              <StewieButton
                label="Initiate Top-Up"
                onPress={initiate}
                variant="primary"
                size="lg"
                fullWidth
                style={styles.submitButton}
                icon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
              />
            </GlassCard>
          </Animated.View>
        </View>

        {/* History */}
        <View style={styles.historyContainer}>
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <StewieText variant="titleLarge" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.md, paddingHorizontal: StewiePayBrand.spacing.md }}>
              History
            </StewieText>
          </Animated.View>

          {loading && topups.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={StewiePayBrand.colors.primary} />
              <StewieText variant="bodyMedium" color="muted" style={{ marginTop: StewiePayBrand.spacing.md }}>
                Loading top-ups...
              </StewieText>
            </View>
          ) : topups.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.emptyContainer}>
              <Ionicons name="add-circle-outline" size={64} color={StewiePayBrand.colors.textMuted} style={{ marginBottom: StewiePayBrand.spacing.lg }} />
              <StewieText variant="titleLarge" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.sm }}>
                No Top-Ups Yet
              </StewieText>
              <StewieText variant="bodyMedium" color="muted" style={{ textAlign: 'center', paddingHorizontal: StewiePayBrand.spacing.lg }}>
                Initiate your first top-up to add funds to your cards
              </StewieText>
            </Animated.View>
          ) : (
            <View style={styles.listContainer}>
              {topups.map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.delay(200 + index * 30).duration(400)}
                >
                  <TouchableOpacity
                    onPress={() => verify(item.id)}
                    activeOpacity={0.8}
                  >
                    <GlassCard elevated intensity={35} style={styles.topUpCard}>
                      <View style={styles.topUpContent}>
                        <View style={styles.topUpLeft}>
                          <StewieText variant="titleLarge" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.xs }}>
                            {item.currency} {item.amount.toLocaleString()}
                          </StewieText>
                          <StewieText variant="bodySmall" color="muted">
                            {item.reference}
                          </StewieText>
                          <StewieText variant="bodySmall" color="muted" style={{ marginTop: StewiePayBrand.spacing.xs }}>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </StewieText>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: getStatusColor(item.status) },
                            ]}
                          />
                          <StewieText
                            variant="labelSmall"
                            style={{ color: getStatusColor(item.status), marginLeft: StewiePayBrand.spacing.xs }}
                            weight="semibold"
                          >
                            {item.status}
                          </StewieText>
                        </View>
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <BackButton />
    </View>
    </ModalTopUpWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: StewiePayBrand.colors.backgroundSecondary,
  },
  header: {
    paddingTop: 110, // Even more space below back button
    paddingBottom: StewiePayBrand.spacing.md,
    paddingHorizontal: StewiePayBrand.spacing.md,
  },
  formContainer: {
    paddingHorizontal: StewiePayBrand.spacing.md,
    marginBottom: StewiePayBrand.spacing.md,
  },
  formCard: {
    padding: StewiePayBrand.spacing.lg,
  },
  inputWrapper: {
    marginBottom: StewiePayBrand.spacing.md,
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
  submitButton: {
    marginTop: StewiePayBrand.spacing.md,
  },
  historyContainer: {
    paddingBottom: StewiePayBrand.spacing['3xl'],
  },
  loadingContainer: {
    padding: StewiePayBrand.spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: StewiePayBrand.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  listContainer: {
    paddingHorizontal: StewiePayBrand.spacing.md,
    paddingBottom: StewiePayBrand.spacing.lg,
  },
  topUpCard: {
    marginBottom: StewiePayBrand.spacing.md,
  },
  topUpContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: StewiePayBrand.spacing.md,
  },
  topUpLeft: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: StewiePayBrand.spacing.sm,
    paddingVertical: StewiePayBrand.spacing.xs,
    borderRadius: StewiePayBrand.radius.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

