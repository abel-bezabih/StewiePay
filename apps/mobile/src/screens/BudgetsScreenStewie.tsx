import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BudgetsAPI } from '../api/client';
import { getCategoryIcon, getCategoryColor } from '../utils/category-utils';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieCard } from '../components/stewiepay/StewieCard';
import { StewieText } from '../components/stewiepay/StewieText';
import { StewieButton } from '../components/stewiepay/StewieButton';
import { GlassCard } from '../components/modern/GlassCard';
import { SkeletonLoader, SkeletonCard, SkeletonList } from '../components/modern/SkeletonLoader';
import { BackButton } from '../components/navigation/BackButton';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  'Food & Drink',
  'Shopping',
  'Travel',
  'Entertainment',
  'Bills & Utilities',
  'Transportation',
  'Healthcare',
  'Education',
  'Gambling',
  'Other',
];

export const BudgetsScreenStewie = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [budgetsResp, progressResp] = await Promise.all([
        BudgetsAPI.list(),
        BudgetsAPI.getProgress(),
      ]);
      setBudgets(budgetsResp.data);
      setProgress(progressResp.data);
    } catch (e) {
      console.error('Failed to load budgets:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCreate = async () => {
    if (!formData.category || !formData.amount) return;

    try {
      await BudgetsAPI.create({
        category: formData.category,
        amount: parseInt(formData.amount),
        period: formData.period,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCreateDialogVisible(false);
      setFormData({ category: '', amount: '', period: 'monthly' });
      loadData();
    } catch (e) {
      console.error('Failed to create budget:', e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleEdit = (budget: any) => {
    setSelectedBudget(budget);
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period,
    });
    setMenuVisible(null);
    setEditDialogVisible(true);
  };

  const handleUpdate = async () => {
    if (!selectedBudget || !formData.amount) return;

    try {
      await BudgetsAPI.update(selectedBudget.id, {
        amount: parseInt(formData.amount),
        period: formData.period,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditDialogVisible(false);
      setSelectedBudget(null);
      loadData();
    } catch (e) {
      console.error('Failed to update budget:', e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleDelete = async (budgetId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMenuVisible(null);
    try {
      await BudgetsAPI.delete(budgetId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadData();
    } catch (e) {
      console.error('Failed to delete budget:', e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const getProgressForBudget = (budgetId: string) => {
    return progress.find((p) => p.budget.id === budgetId);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <BackButton />
        <ScrollView contentContainerStyle={styles.loadingContent}>
          <View style={styles.header}>
            <SkeletonLoader width={200} height={32} borderRadius={8} />
            <SkeletonLoader width={250} height={16} borderRadius={8} style={{ marginTop: 8 }} />
          </View>
          <SkeletonList count={3} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={StewiePayBrand.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* StewiePay Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <StewieText variant="headlineLarge" color="primary" weight="black">
            Budgets
          </StewieText>
          <StewieText variant="bodyMedium" color="muted" style={{ marginTop: StewiePayBrand.spacing.xs }}>
            Track your spending by category • Stay in control
          </StewieText>
        </Animated.View>

        <View style={styles.content}>
          {budgets.length === 0 ? (
            <Animated.View entering={FadeInDown.duration(400)}>
              <GlassCard elevated intensity={35} style={styles.emptyCard}>
                <StewieText variant="titleMedium" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.sm, textAlign: 'center' }}>
                  No Budgets Set
                </StewieText>
                <StewieText variant="bodyMedium" color="muted" style={{ textAlign: 'center' }}>
                  Create a budget to track your spending by category.
                </StewieText>
              </GlassCard>
            </Animated.View>
          ) : (
            <View style={styles.budgetsList}>
              {budgets.map((budget, index) => {
                const progressData = getProgressForBudget(budget.id);
                const spent = progressData?.spent || 0;
                const remaining = progressData?.remaining || budget.amount;
                const percentage = progressData?.percentage || 0;
                const isOverBudget = percentage >= 100;
                const isWarning = percentage >= 80 && percentage < 100;

                return (
                  <Animated.View
                    key={budget.id}
                    entering={FadeInDown.delay(100 + index * 50).duration(400)}
                  >
                    <GlassCard elevated intensity={35} style={styles.budgetCard}>
                      <View style={styles.budgetHeader}>
                        <View style={styles.budgetInfo}>
                          <View
                            style={[
                              styles.categoryBadge,
                              { backgroundColor: `${getCategoryColor(budget.category)}20` },
                            ]}
                          >
                            <StewieText variant="titleLarge" style={{ fontSize: 20 }}>
                              {getCategoryIcon(budget.category)}
                            </StewieText>
                          </View>
                          <View style={{ marginLeft: StewiePayBrand.spacing.sm }}>
                            <StewieText variant="titleMedium" color="primary" weight="semibold">
                              {budget.category}
                            </StewieText>
                            <StewieText variant="bodySmall" color="muted">
                              {budget.period === 'monthly' ? 'Monthly' : 'Weekly'}
                            </StewieText>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setMenuVisible(menuVisible === budget.id ? null : budget.id);
                          }}
                        >
                          <Ionicons name="ellipsis-vertical" size={20} color={StewiePayBrand.colors.textMuted} />
                        </TouchableOpacity>
                      </View>

                      {menuVisible === budget.id && (
                        <View style={styles.menu}>
                          <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleEdit(budget)}
                          >
                            <Ionicons name="pencil" size={18} color={StewiePayBrand.colors.textSecondary} />
                            <StewieText variant="bodyMedium" color="secondary" style={{ marginLeft: StewiePayBrand.spacing.sm }}>
                              Edit
                            </StewieText>
                          </TouchableOpacity>
                          <View style={styles.menuDivider} />
                          <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleDelete(budget.id)}
                          >
                            <Ionicons name="trash-outline" size={18} color={StewiePayBrand.colors.error} />
                            <StewieText variant="bodyMedium" color="error" style={{ marginLeft: StewiePayBrand.spacing.sm }}>
                              Delete
                            </StewieText>
                          </TouchableOpacity>
                        </View>
                      )}

                      <View style={styles.budgetAmounts}>
                        <View>
                          <StewieText variant="labelMedium" color="muted" style={{ marginBottom: StewiePayBrand.spacing.xs }}>
                            Budget
                          </StewieText>
                          <StewieText variant="titleLarge" color="primary" weight="bold">
                            ETB {budget.amount.toLocaleString()}
                          </StewieText>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <StewieText variant="labelMedium" color="muted" style={{ marginBottom: StewiePayBrand.spacing.xs }}>
                            Spent
                          </StewieText>
                          <StewieText
                            variant="titleLarge"
                            weight="bold"
                            style={{
                              color: isOverBudget ? StewiePayBrand.colors.error : StewiePayBrand.colors.textPrimary,
                            }}
                          >
                            ETB {spent.toLocaleString()}
                          </StewieText>
                        </View>
                      </View>

                      {/* Progress Bar */}
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${Math.min(percentage, 100)}%`,
                                backgroundColor: isOverBudget
                                  ? StewiePayBrand.colors.error
                                  : isWarning
                                  ? StewiePayBrand.colors.warning
                                  : StewiePayBrand.colors.success,
                              },
                            ]}
                          />
                        </View>
                        <View style={styles.progressInfo}>
                          <StewieText
                            variant="bodySmall"
                            style={{
                              color: isOverBudget
                                ? StewiePayBrand.colors.error
                                : isWarning
                                ? StewiePayBrand.colors.warning
                                : StewiePayBrand.colors.textMuted,
                            }}
                          >
                            {percentage.toFixed(1)}% used
                          </StewieText>
                        </View>
                      </View>

                      <View style={styles.budgetFooter}>
                        <StewieText variant="bodySmall" color="muted">
                          {remaining >= 0
                            ? `ETB ${remaining.toLocaleString()} remaining`
                            : `ETB ${Math.abs(remaining).toLocaleString()} over`}
                        </StewieText>
                      </View>
                    </GlassCard>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Budget Dialog */}
      <Modal
        visible={createDialogVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateDialogVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard elevated intensity={40} style={styles.modalCard}>
            <StewieText variant="titleLarge" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.lg }}>
              Create Budget
            </StewieText>

            <View style={styles.inputWrapper}>
              <StewieText variant="labelMedium" color="muted" style={styles.inputLabel}>
                Category
              </StewieText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setFormData({ ...formData, category: cat });
                    }}
                    style={[
                      styles.categoryOption,
                      formData.category === cat && { backgroundColor: StewiePayBrand.colors.primary },
                    ]}
                  >
                    <StewieText
                      variant="bodyMedium"
                      color={formData.category === cat ? 'primary' : 'secondary'}
                      weight={formData.category === cat ? 'semibold' : 'regular'}
                    >
                      {getCategoryIcon(cat)} {cat}
                    </StewieText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputWrapper}>
              <StewieText variant="labelMedium" color="muted" style={styles.inputLabel}>
                Amount (ETB)
              </StewieText>
              <View style={styles.inputBox}>
                <TextInput
                  placeholder="e.g., 5000"
                  placeholderTextColor={StewiePayBrand.colors.textMuted}
                  value={formData.amount}
                  onChangeText={(text) => setFormData({ ...formData, amount: text })}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.buttonRow}>
              <StewieButton
                label="Cancel"
                onPress={() => setCreateDialogVisible(false)}
                variant="outline"
                size="md"
                style={{ flex: 1, marginRight: StewiePayBrand.spacing.sm }}
              />
              <StewieButton
                label="Create"
                onPress={handleCreate}
                variant="primary"
                size="md"
                disabled={!formData.category || !formData.amount}
                style={{ flex: 1 }}
              />
            </View>
          </GlassCard>
        </View>
      </Modal>

      {/* Edit Budget Dialog */}
      <Modal
        visible={editDialogVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditDialogVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard elevated intensity={40} style={styles.modalCard}>
            <StewieText variant="titleLarge" color="primary" weight="bold" style={{ marginBottom: StewiePayBrand.spacing.lg }}>
              Edit Budget
            </StewieText>

            <View style={styles.inputWrapper}>
              <StewieText variant="labelMedium" color="muted" style={styles.inputLabel}>
                Amount (ETB)
              </StewieText>
              <View style={styles.inputBox}>
                <TextInput
                  placeholder="e.g., 5000"
                  placeholderTextColor={StewiePayBrand.colors.textMuted}
                  value={formData.amount}
                  onChangeText={(text) => setFormData({ ...formData, amount: text })}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.buttonRow}>
              <StewieButton
                label="Cancel"
                onPress={() => setEditDialogVisible(false)}
                variant="outline"
                size="md"
                style={{ flex: 1, marginRight: StewiePayBrand.spacing.sm }}
              />
              <StewieButton
                label="Update"
                onPress={handleUpdate}
                variant="primary"
                size="md"
                disabled={!formData.amount}
                style={{ flex: 1 }}
              />
            </View>
          </GlassCard>
        </View>
      </Modal>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setCreateDialogVisible(true);
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={StewiePayBrand.colors.gradients.primary as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
      <BackButton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: StewiePayBrand.colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: StewiePayBrand.colors.backgroundSecondary,
  },
  loadingContent: {
    padding: StewiePayBrand.spacing.lg,
    paddingTop: 130, // Even more space below back button
  },
  header: {
    paddingTop: 110, // Even more space below back button
    paddingBottom: StewiePayBrand.spacing.md,
    paddingHorizontal: StewiePayBrand.spacing.md,
  },
  content: {
    paddingHorizontal: StewiePayBrand.spacing.md,
  },
  emptyCard: {
    marginBottom: StewiePayBrand.spacing.lg,
    padding: StewiePayBrand.spacing['2xl'],
    alignItems: 'center',
  },
  budgetsList: {
    gap: StewiePayBrand.spacing.md,
    marginBottom: StewiePayBrand.spacing['3xl'],
  },
  budgetCard: {
    padding: StewiePayBrand.spacing.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: StewiePayBrand.spacing.md,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryBadge: {
    width: 48,
    height: 48,
    borderRadius: StewiePayBrand.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    backgroundColor: StewiePayBrand.colors.surfaceElevated,
    borderRadius: StewiePayBrand.radius.md,
    padding: StewiePayBrand.spacing.xs,
    marginBottom: StewiePayBrand.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: StewiePayBrand.spacing.sm,
  },
  menuDivider: {
    height: 1,
    backgroundColor: StewiePayBrand.colors.surfaceVariant,
    marginVertical: StewiePayBrand.spacing.xs,
  },
  budgetAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: StewiePayBrand.spacing.md,
  },
  progressContainer: {
    marginBottom: StewiePayBrand.spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: StewiePayBrand.colors.surfaceVariant,
    borderRadius: StewiePayBrand.radius.full,
    overflow: 'hidden',
    marginBottom: StewiePayBrand.spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: StewiePayBrand.radius.full,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetFooter: {
    marginTop: StewiePayBrand.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: StewiePayBrand.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: StewiePayBrand.radius['2xl'],
    borderTopRightRadius: StewiePayBrand.radius['2xl'],
    padding: StewiePayBrand.spacing.lg,
    paddingBottom: StewiePayBrand.spacing['3xl'],
  },
  inputWrapper: {
    marginBottom: StewiePayBrand.spacing.md,
  },
  inputLabel: {
    marginBottom: StewiePayBrand.spacing.xs,
  },
  categoryScroll: {
    marginTop: StewiePayBrand.spacing.sm,
  },
  categoryOption: {
    paddingHorizontal: StewiePayBrand.spacing.md,
    paddingVertical: StewiePayBrand.spacing.sm,
    borderRadius: StewiePayBrand.radius.full,
    backgroundColor: StewiePayBrand.colors.surface,
    marginRight: StewiePayBrand.spacing.sm,
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
  input: {
    flex: 1,
    fontSize: StewiePayBrand.typography.styles.bodyMedium.fontSize,
    fontWeight: StewiePayBrand.typography.styles.bodyMedium.fontWeight as '400' | '500' | '600' | '700' | '800' | '900',
    lineHeight: StewiePayBrand.typography.styles.bodyMedium.lineHeight,
    letterSpacing: StewiePayBrand.typography.styles.bodyMedium.letterSpacing,
    color: StewiePayBrand.colors.textPrimary,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: StewiePayBrand.spacing.lg,
  },
  fab: {
    position: 'absolute',
    right: StewiePayBrand.spacing.md,
    bottom: StewiePayBrand.spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    ...StewiePayBrand.shadows.lg,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});




