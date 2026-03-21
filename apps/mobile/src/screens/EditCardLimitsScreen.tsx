import React, { useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { CardsAPI } from '../api/client';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieCard } from '../components/stewiepay/StewieCard';
import { StewieText } from '../components/stewiepay/StewieText';
import { StewieButton } from '../components/stewiepay/StewieButton';
import { BackButton } from '../components/navigation/BackButton';

export const EditCardLimitsScreen = ({ route, navigation }: any) => {
  const { cardId, limits } = route.params || {};
  const [daily, setDaily] = useState(limits?.limitDaily ? String(limits.limitDaily) : '');
  const [monthly, setMonthly] = useState(limits?.limitMonthly ? String(limits.limitMonthly) : '');
  const [perTxn, setPerTxn] = useState(limits?.limitPerTxn ? String(limits.limitPerTxn) : '');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dailyValue = daily.trim() ? Number(daily) : null;
  const monthlyValue = monthly.trim() ? Number(monthly) : null;
  const perTxnValue = perTxn.trim() ? Number(perTxn) : null;

  const validateLimits = () => {
    if (dailyValue && monthlyValue && dailyValue > monthlyValue) {
      return 'Daily limit cannot exceed monthly limit.';
    }
    if (perTxnValue && dailyValue && perTxnValue > dailyValue) {
      return 'Per-transaction limit cannot exceed daily limit.';
    }
    return null;
  };

  const save = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setErrorMessage(null);
    try {
      const validationError = validateLimits();
      if (validationError) {
        setErrorMessage(validationError);
        return;
      }
      const payload = {
        limitDaily: dailyValue,
        limitMonthly: monthlyValue,
        limitPerTxn: perTxnValue,
      };
      await CardsAPI.updateLimits(cardId, payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMessage(e?.response?.data?.message || 'Failed to update limits');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <StewieCard elevated style={styles.card}>
        <StewieText variant="titleLarge" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.sm }}>
          Edit Limits
        </StewieText>
        <StewieText variant="bodySmall" color="muted" style={{ marginBottom: StewiePayBrand.spacing.md }}>
          Leave a field empty to remove that limit.
        </StewieText>

        <View style={styles.inputWrapper}>
          <StewieText variant="labelMedium" color="muted" style={styles.inputLabel}>
            Daily limit (ETB)
          </StewieText>
          <View style={styles.inputBox}>
            <Ionicons name="calendar-outline" size={20} color={StewiePayBrand.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="e.g. 50000"
              placeholderTextColor={StewiePayBrand.colors.textMuted}
              value={daily}
              onChangeText={(val) => setDaily(val.replace(/\D/g, ''))}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
          <StewieText variant="labelSmall" color="muted" style={styles.helperText}>
            Must be less than or equal to monthly.
          </StewieText>
        </View>

        <View style={styles.inputWrapper}>
          <StewieText variant="labelMedium" color="muted" style={styles.inputLabel}>
            Monthly limit (ETB)
          </StewieText>
          <View style={styles.inputBox}>
            <Ionicons name="calendar-number-outline" size={20} color={StewiePayBrand.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="e.g. 200000"
              placeholderTextColor={StewiePayBrand.colors.textMuted}
              value={monthly}
              onChangeText={(val) => setMonthly(val.replace(/\D/g, ''))}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
          <StewieText variant="labelSmall" color="muted" style={styles.helperText}>
            Higher than daily limit.
          </StewieText>
        </View>

        <View style={styles.inputWrapper}>
          <StewieText variant="labelMedium" color="muted" style={styles.inputLabel}>
            Per transaction (ETB)
          </StewieText>
          <View style={styles.inputBox}>
            <Ionicons name="swap-horizontal-outline" size={20} color={StewiePayBrand.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="e.g. 10000"
              placeholderTextColor={StewiePayBrand.colors.textMuted}
              value={perTxn}
              onChangeText={(val) => setPerTxn(val.replace(/\D/g, ''))}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
          <StewieText variant="labelSmall" color="muted" style={styles.helperText}>
            Must be less than or equal to daily.
          </StewieText>
        </View>

        <StewieButton
          label={loading ? 'Saving...' : 'Save Limits'}
          onPress={save}
          variant="primary"
          size="lg"
          fullWidth
          disabled={loading}
          style={styles.saveButton}
        />

        {errorMessage && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={StewiePayBrand.colors.error} />
            <StewieText variant="bodySmall" style={styles.errorText}>
              {errorMessage}
            </StewieText>
          </View>
        )}
      </StewieCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: StewiePayBrand.colors.backgroundSecondary,
    paddingTop: 80,
    paddingHorizontal: StewiePayBrand.spacing.md,
  },
  card: {
    padding: StewiePayBrand.spacing.lg,
  },
  inputWrapper: {
    marginBottom: StewiePayBrand.spacing.md,
  },
  inputLabel: {
    marginBottom: StewiePayBrand.spacing.xs,
  },
  helperText: {
    marginTop: StewiePayBrand.spacing.xs,
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
  saveButton: {
    marginTop: StewiePayBrand.spacing.sm,
  },
  errorBox: {
    marginTop: StewiePayBrand.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${StewiePayBrand.colors.error}10`,
    borderRadius: StewiePayBrand.radius.md,
    borderWidth: 1,
    borderColor: `${StewiePayBrand.colors.error}40`,
    paddingHorizontal: StewiePayBrand.spacing.md,
    paddingVertical: StewiePayBrand.spacing.sm,
  },
  errorText: {
    marginLeft: StewiePayBrand.spacing.sm,
    color: StewiePayBrand.colors.error,
    flex: 1,
  },
});
