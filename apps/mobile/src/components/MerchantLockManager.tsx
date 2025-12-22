import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
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

  const handleSave = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
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
    if (isBlocked) {
      if (!blockedMerchants.includes(trimmed)) {
        setBlockedMerchants([...blockedMerchants, trimmed]);
      }
    } else {
      if (!allowedMerchants.includes(trimmed)) {
        setAllowedMerchants([...allowedMerchants, trimmed]);
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
    if (isBlocked) {
      if (!blockedCategories.includes(trimmed)) {
        setBlockedCategories([...blockedCategories, trimmed]);
      }
    } else {
      if (!allowedCategories.includes(trimmed)) {
        setAllowedCategories([...allowedCategories, trimmed]);
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
                onChangeText={setCategoryInput}
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
                onChangeText={setCategoryInput}
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
        </View>
      )}

      <StewieButton
        label={loading ? 'Saving...' : 'Save Merchant Locks'}
        onPress={handleSave}
        variant="primary"
        size="md"
        fullWidth
        disabled={loading}
        style={styles.saveButton}
        icon={loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : undefined}
      />
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
    ...StewiePayBrand.typography.styles.bodyMedium,
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
});
