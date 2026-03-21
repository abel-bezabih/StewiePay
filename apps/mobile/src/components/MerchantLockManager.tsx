import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, TextStyle } from 'react-native';
import { CardsAPI } from '../api/client';
import * as Haptics from 'expo-haptics';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieCard } from './stewiepay/StewieCard';
import { StewieText } from './stewiepay/StewieText';
import { StewieButton } from './stewiepay/StewieButton';
import { Ionicons } from '@expo/vector-icons';

interface MerchantLockManagerProps {
  card: any;
  onUpdate: () => void;
}

export const MerchantLockManager: React.FC<MerchantLockManagerProps> = ({ card, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'BLOCK' | 'ALLOW' | null>(card.merchantLockMode || null);
  const [merchantInput, setMerchantInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [blockedMerchants, setBlockedMerchants] = useState<string[]>(card.blockedMerchants || []);
  const [allowedMerchants, setAllowedMerchants] = useState<string[]>(card.allowedMerchants || []);
  const [blockedCategories, setBlockedCategories] = useState<string[]>(card.blockedCategories || []);
  const [allowedCategories, setAllowedCategories] = useState<string[]>(card.allowedCategories || []);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasBlocked = blockedMerchants.length > 0 || blockedCategories.length > 0;
  const hasAllowed = allowedMerchants.length > 0 || allowedCategories.length > 0;
  const canSave = !loading && (mode === null || (mode === 'BLOCK' ? hasBlocked : hasAllowed));
  const modeHint =
    mode === 'BLOCK'
      ? 'Blocked list wins. Anything in the list will be rejected.'
      : mode === 'ALLOW'
        ? 'Only items in the list will be allowed.'
        : 'No restrictions. All merchants are allowed.';

  const handleSave = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      setErrorMessage(null);
      if (mode === 'BLOCK' && !hasBlocked) {
        setErrorMessage('Add at least one blocked merchant or category.');
        return;
      }
      if (mode === 'ALLOW' && !hasAllowed) {
        setErrorMessage('Add at least one allowed merchant or category.');
        return;
      }
      await CardsAPI.updateMerchantLocks(card.id, {
        merchantLockMode: mode || undefined,
        blockedMerchants: mode === 'BLOCK' ? blockedMerchants : [],
        allowedMerchants: mode === 'ALLOW' ? allowedMerchants : [],
        blockedCategories: mode === 'BLOCK' ? blockedCategories : [],
        allowedCategories: mode === 'ALLOW' ? allowedCategories : [],
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUpdate();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Failed to update merchant locks:', e);
    } finally {
      setLoading(false);
    }
  };

  const addMerchant = (merchant: string, isBlocked: boolean) => {
    if (!merchant.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const trimmed = merchant.trim();
    const normalized = trimmed.toLowerCase();
    if (isBlocked) {
      const existing = blockedMerchants.some((m) => m.toLowerCase() === normalized);
      if (!existing) {
        setBlockedMerchants([...blockedMerchants, trimmed]);
      } else {
        setErrorMessage('That blocked merchant is already added.');
      }
    } else {
      const existing = allowedMerchants.some((m) => m.toLowerCase() === normalized);
      if (!existing) {
        setAllowedMerchants([...allowedMerchants, trimmed]);
      } else {
        setErrorMessage('That allowed merchant is already added.');
      }
    }
    setMerchantInput('');
  };

  const removeMerchant = (merchant: string, isBlocked: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isBlocked) {
      setBlockedMerchants(blockedMerchants.filter((m) => m !== merchant));
    } else {
      setAllowedMerchants(allowedMerchants.filter((m) => m !== merchant));
    }
  };

  const addCategory = (category: string, isBlocked: boolean) => {
    if (!category.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const trimmed = category.trim();
    const normalized = trimmed.toUpperCase();
    if (isBlocked) {
      const existing = blockedCategories.some((c) => c.toUpperCase() === normalized);
      if (!existing) {
        setBlockedCategories([...blockedCategories, normalized]);
      } else {
        setErrorMessage('That blocked category is already added.');
      }
    } else {
      const existing = allowedCategories.some((c) => c.toUpperCase() === normalized);
      if (!existing) {
        setAllowedCategories([...allowedCategories, normalized]);
      } else {
        setErrorMessage('That allowed category is already added.');
      }
    }
    setCategoryInput('');
  };

  const removeCategory = (category: string, isBlocked: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isBlocked) {
      setBlockedCategories(blockedCategories.filter((c) => c !== category));
    } else {
      setAllowedCategories(allowedCategories.filter((c) => c !== category));
    }
  };

  return (
    <StewieCard elevated style={styles.card}>
      <StewieText variant="titleLarge" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.xs }}>
        Merchant Controls
      </StewieText>
      <StewieText variant="bodyMedium" color="muted" style={{ marginBottom: StewiePayBrand.spacing.md }}>
        Control where this card can be used
      </StewieText>

      {/* Mode Selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMode(null);
            setErrorMessage(null);
          }}
          style={[
            styles.modeButton,
            mode === null && styles.modeButtonActive,
          ]}
        >
          <StewieText
            variant="labelMedium"
            weight={mode === null ? 'bold' : 'regular'}
            style={{
              color: mode === null ? StewiePayBrand.colors.textPrimary : StewiePayBrand.colors.textMuted,
            }}
          >
            None
          </StewieText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMode('BLOCK');
            setErrorMessage(null);
          }}
          style={[
            styles.modeButton,
            mode === 'BLOCK' && styles.modeButtonActive,
          ]}
        >
          <StewieText
            variant="labelMedium"
            weight={mode === 'BLOCK' ? 'bold' : 'regular'}
            style={{
              color: mode === 'BLOCK' ? StewiePayBrand.colors.error : StewiePayBrand.colors.textMuted,
            }}
          >
            Block
          </StewieText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMode('ALLOW');
            setErrorMessage(null);
          }}
          style={[
            styles.modeButton,
            mode === 'ALLOW' && styles.modeButtonActive,
          ]}
        >
          <StewieText
            variant="labelMedium"
            weight={mode === 'ALLOW' ? 'bold' : 'regular'}
            style={{
              color: mode === 'ALLOW' ? StewiePayBrand.colors.success : StewiePayBrand.colors.textMuted,
            }}
          >
            Allow
          </StewieText>
        </TouchableOpacity>
      </View>
      <StewieText variant="bodySmall" color="muted" style={styles.helperText}>
        {modeHint}
      </StewieText>

      {mode !== null && !canSave && (
        <StewieText variant="bodySmall" style={styles.inlineWarning}>
          Add at least one merchant or MCC category to use this mode.
        </StewieText>
      )}

      {mode === 'BLOCK' && (
        <View style={styles.section}>
          <StewieText variant="titleMedium" color="primary" weight="semibold" style={{ marginBottom: StewiePayBrand.spacing.sm }}>
            Blocked Merchants
          </StewieText>
          <View style={styles.inputRow}>
            <View style={styles.inputBox}>
              <Ionicons name="storefront-outline" size={20} color={StewiePayBrand.colors.textMuted} style={styles.inputIcon} />
              <TextInput
                placeholder="Merchant name"
                placeholderTextColor={StewiePayBrand.colors.textMuted}
                value={merchantInput}
                onChangeText={setMerchantInput}
                onSubmitEditing={() => addMerchant(merchantInput, true)}
                style={styles.input}
              />
            </View>
            <StewieButton
              label="Add"
              onPress={() => addMerchant(merchantInput, true)}
              variant="primary"
              size="sm"
              disabled={!merchantInput.trim()}
              style={styles.addButton}
            />
          </View>
          <View style={styles.chipContainer}>
            {blockedMerchants.map((merchant: string) => (
              <TouchableOpacity
                key={merchant}
                onPress={() => removeMerchant(merchant, true)}
                style={[styles.chip, { backgroundColor: `${StewiePayBrand.colors.error}20` }]}
              >
                <StewieText variant="labelSmall" style={{ color: StewiePayBrand.colors.error, marginRight: StewiePayBrand.spacing.xs }}>
                  {merchant}
                </StewieText>
                <Ionicons name="close-circle" size={16} color={StewiePayBrand.colors.error} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          <StewieText variant="titleMedium" color="primary" weight="semibold" style={{ marginBottom: StewiePayBrand.spacing.sm }}>
            Blocked Categories (MCC)
          </StewieText>
          <View style={styles.inputRow}>
            <View style={styles.inputBox}>
              <Ionicons name="grid-outline" size={20} color={StewiePayBrand.colors.textMuted} style={styles.inputIcon} />
              <TextInput
                placeholder="MCC code (e.g., 7995)"
                placeholderTextColor={StewiePayBrand.colors.textMuted}
                value={categoryInput}
                onChangeText={(value) => setCategoryInput(value.replace(/\D/g, ''))}
                keyboardType="numeric"
                onSubmitEditing={() => addCategory(categoryInput, true)}
                style={styles.input}
              />
            </View>
            <StewieButton
              label="Add"
              onPress={() => addCategory(categoryInput, true)}
              variant="primary"
              size="sm"
              disabled={!categoryInput.trim()}
              style={styles.addButton}
            />
          </View>
          <View style={styles.chipContainer}>
            {blockedCategories.map((cat: string) => (
              <TouchableOpacity
                key={cat}
                onPress={() => removeCategory(cat, true)}
                style={[styles.chip, { backgroundColor: `${StewiePayBrand.colors.error}20` }]}
              >
                <StewieText variant="labelSmall" style={{ color: StewiePayBrand.colors.error, marginRight: StewiePayBrand.spacing.xs }}>
                  {cat}
                </StewieText>
                <Ionicons name="close-circle" size={16} color={StewiePayBrand.colors.error} />
              </TouchableOpacity>
            ))}
          </View>
          <StewieText variant="labelSmall" color="muted" style={styles.helperText}>
            Use 4-digit MCC codes (digits only).
          </StewieText>
        </View>
      )}

      {mode === 'ALLOW' && (
        <View style={styles.section}>
          <StewieText variant="titleMedium" color="primary" weight="semibold" style={{ marginBottom: StewiePayBrand.spacing.sm }}>
            Allowed Merchants
          </StewieText>
          <View style={styles.inputRow}>
            <View style={styles.inputBox}>
              <Ionicons name="storefront-outline" size={20} color={StewiePayBrand.colors.textMuted} style={styles.inputIcon} />
              <TextInput
                placeholder="Merchant name"
                placeholderTextColor={StewiePayBrand.colors.textMuted}
                value={merchantInput}
                onChangeText={setMerchantInput}
                onSubmitEditing={() => addMerchant(merchantInput, false)}
                style={styles.input}
              />
            </View>
            <StewieButton
              label="Add"
              onPress={() => addMerchant(merchantInput, false)}
              variant="primary"
              size="sm"
              disabled={!merchantInput.trim()}
              style={styles.addButton}
            />
          </View>
          <View style={styles.chipContainer}>
            {allowedMerchants.map((merchant: string) => (
              <TouchableOpacity
                key={merchant}
                onPress={() => removeMerchant(merchant, false)}
                style={[styles.chip, { backgroundColor: `${StewiePayBrand.colors.success}20` }]}
              >
                <StewieText variant="labelSmall" style={{ color: StewiePayBrand.colors.success, marginRight: StewiePayBrand.spacing.xs }}>
                  {merchant}
                </StewieText>
                <Ionicons name="close-circle" size={16} color={StewiePayBrand.colors.success} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          <StewieText variant="titleMedium" color="primary" weight="semibold" style={{ marginBottom: StewiePayBrand.spacing.sm }}>
            Allowed Categories (MCC)
          </StewieText>
          <View style={styles.inputRow}>
            <View style={styles.inputBox}>
              <Ionicons name="grid-outline" size={20} color={StewiePayBrand.colors.textMuted} style={styles.inputIcon} />
              <TextInput
                placeholder="MCC code (e.g., 5411)"
                placeholderTextColor={StewiePayBrand.colors.textMuted}
                value={categoryInput}
                onChangeText={(value) => setCategoryInput(value.replace(/\D/g, ''))}
                keyboardType="numeric"
                onSubmitEditing={() => addCategory(categoryInput, false)}
                style={styles.input}
              />
            </View>
            <StewieButton
              label="Add"
              onPress={() => addCategory(categoryInput, false)}
              variant="primary"
              size="sm"
              disabled={!categoryInput.trim()}
              style={styles.addButton}
            />
          </View>
          <View style={styles.chipContainer}>
            {allowedCategories.map((cat: string) => (
              <TouchableOpacity
                key={cat}
                onPress={() => removeCategory(cat, false)}
                style={[styles.chip, { backgroundColor: `${StewiePayBrand.colors.success}20` }]}
              >
                <StewieText variant="labelSmall" style={{ color: StewiePayBrand.colors.success, marginRight: StewiePayBrand.spacing.xs }}>
                  {cat}
                </StewieText>
                <Ionicons name="close-circle" size={16} color={StewiePayBrand.colors.success} />
              </TouchableOpacity>
            ))}
          </View>
          <StewieText variant="labelSmall" color="muted" style={styles.helperText}>
            Use 4-digit MCC codes (digits only).
          </StewieText>
        </View>
      )}

      <StewieButton
        label={loading ? 'Saving...' : 'Save Merchant Locks'}
        onPress={handleSave}
        variant="primary"
        size="md"
        fullWidth
        disabled={!canSave}
        style={styles.saveButton}
        icon={loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : undefined}
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
  );
};

const styles = StyleSheet.create({
  card: {
    padding: StewiePayBrand.spacing.md,
    marginBottom: StewiePayBrand.spacing.md,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: StewiePayBrand.colors.surface,
    borderRadius: StewiePayBrand.radius.md,
    padding: StewiePayBrand.spacing.xs,
    marginBottom: StewiePayBrand.spacing.md,
  },
  helperText: {
    marginBottom: StewiePayBrand.spacing.sm,
  },
  inlineWarning: {
    color: StewiePayBrand.colors.warning,
    marginBottom: StewiePayBrand.spacing.sm,
  },
  modeButton: {
    flex: 1,
    paddingVertical: StewiePayBrand.spacing.sm,
    paddingHorizontal: StewiePayBrand.spacing.sm,
    borderRadius: StewiePayBrand.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: StewiePayBrand.colors.surfaceElevated,
  },
  section: {
    marginBottom: StewiePayBrand.spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: StewiePayBrand.spacing.sm,
    marginBottom: StewiePayBrand.spacing.sm,
  },
  inputBox: {
    flex: 1,
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
    fontWeight: StewiePayBrand.typography.styles.bodyMedium.fontWeight as TextStyle['fontWeight'],
    lineHeight: StewiePayBrand.typography.styles.bodyMedium.lineHeight,
    letterSpacing: StewiePayBrand.typography.styles.bodyMedium.letterSpacing,
    color: StewiePayBrand.colors.textPrimary,
  },
  addButton: {
    minWidth: 80,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: StewiePayBrand.spacing.sm,
    marginTop: StewiePayBrand.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: StewiePayBrand.spacing.sm,
    paddingVertical: StewiePayBrand.spacing.xs,
    borderRadius: StewiePayBrand.radius.full,
  },
  divider: {
    height: 1,
    backgroundColor: StewiePayBrand.colors.surfaceVariant,
    marginVertical: StewiePayBrand.spacing.md,
  },
  saveButton: {
    marginTop: StewiePayBrand.spacing.md,
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
