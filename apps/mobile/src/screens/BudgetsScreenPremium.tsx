// @ts-nocheck - Premium screen not in use, using react-native-paper which is not installed
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Dimensions
} from 'react-native';
// These imports are commented out as react-native-paper is not installed
// The screen is not currently used in navigation
/*
import {
  Text,
  Card,
  ActivityIndicator,
  ProgressBar,
  FAB,
  Chip,
  IconButton,
  Menu,
  Divider,
  Dialog,
  Portal,
  TextInput,
  Button
} from 'react-native-paper';
import { useTheme } from 'react-native-paper';
*/
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import { BudgetsAPI } from '../api/client';
import { getCategoryIcon, getCategoryColor } from '../utils/category-utils';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { ProgressRing } from '../components/ProgressRing';
import { BrandButton } from '../components/BrandButton';
import { StewiePayBrand } from '../brand/StewiePayBrand';

const { width } = Dimensions.get('window');

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
  'Other'
];

export const BudgetsScreenPremium = () => {
  const theme = useTheme();
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
    period: 'monthly'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [budgetsResp, progressResp] = await Promise.all([
        BudgetsAPI.list(),
        BudgetsAPI.getProgress()
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
        period: formData.period
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
      period: budget.period
    });
    setMenuVisible(null);
    setEditDialogVisible(true);
  };

  const handleUpdate = async () => {
    if (!selectedBudget || !formData.amount) return;

    try {
      await BudgetsAPI.update(selectedBudget.id, {
        amount: parseInt(formData.amount),
        period: formData.period
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
    return progress.find(p => p.budget.id === budgetId);
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: StewiePayBrand.colors.background }]}>
        <ActivityIndicator size="large" color={StewiePayBrand.colors.primary} />
        <Text variant="bodyLarge" style={{ color: StewiePayBrand.colors.onSurfaceVariant, marginTop: 16 }}>
          Loading budgets...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: StewiePayBrand.colors.background }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.headerTitle}>
            Budgets
          </Text>
        </View>

        <View style={styles.content}>
          {/* Budgets List */}
          {budgets.length === 0 ? (
            <Animatable.View animation="fadeInUp" duration={600}>
              <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
                <Card.Content style={styles.emptyCardContent}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
                    No Budgets Set
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                    Create a budget to track your spending by category.
                  </Text>
                </Card.Content>
              </Card>
            </Animatable.View>
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
                  <Animatable.View
                    key={budget.id}
                    animation="fadeInUp"
                    duration={600}
                    delay={index * 100}
                  >
                    <View style={styles.budgetCard}>
                        <View style={styles.budgetHeader}>
                          <View style={styles.budgetInfo}>
                            <Chip
                              icon={() => <Text>{getCategoryIcon(budget.category)}</Text>}
                              style={{
                                backgroundColor: getCategoryColor(budget.category),
                                marginRight: 8
                              }}
                              textStyle={{ color: theme.colors.onPrimary }}
                            >
                              {budget.category}
                            </Chip>
                            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                              {budget.period === 'monthly' ? 'Monthly' : 'Weekly'}
                            </Text>
                          </View>
                          <Menu
                            visible={menuVisible === budget.id}
                            onDismiss={() => setMenuVisible(null)}
                            anchor={
                              <IconButton
                                icon="dots-vertical"
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  setMenuVisible(budget.id);
                                }}
                              />
                            }
                          >
                            <Menu.Item onPress={() => handleEdit(budget)} title="Edit" />
                            <Divider />
                            <Menu.Item onPress={() => handleDelete(budget.id)} title="Delete" />
                          </Menu>
                        </View>

                        <View style={styles.budgetAmounts}>
                          <View>
                            <Text variant="labelLarge" style={{ color: StewiePayBrand.colors.onSurfaceVariant, marginBottom: 4 }}>
                              Budget
                            </Text>
                            <AnimatedCounter
                              value={budget.amount}
                              prefix="ETB "
                              useSpring={true}
                              style={{ fontSize: 20, fontWeight: '700', color: StewiePayBrand.colors.onSurface }}
                            />
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text variant="labelLarge" style={{ color: StewiePayBrand.colors.onSurfaceVariant, marginBottom: 4 }}>
                              Spent
                            </Text>
                            <AnimatedCounter
                              value={spent}
                              prefix="ETB "
                              useSpring={true}
                              style={{
                                fontSize: 20,
                                fontWeight: '700',
                                color: isOverBudget ? StewiePayBrand.colors.error : StewiePayBrand.colors.onSurface
                              }}
                            />
                          </View>
                        </View>

                        <View style={styles.progressContainer}>
                          <ProgressRing
                            progress={Math.min(percentage / 100, 1)}
                            size={60}
                            strokeWidth={6}
                            color={
                              isOverBudget
                                ? StewiePayBrand.colors.error
                                : isWarning
                                ? StewiePayBrand.colors.warning
                                : StewiePayBrand.colors.primary
                            }
                            animated={true}
                          />
                          <View style={styles.progressInfo}>
                            <Text
                              variant="bodySmall"
                              style={{
                                color: isOverBudget
                                  ? StewiePayBrand.colors.error
                                  : isWarning
                                  ? StewiePayBrand.colors.warning
                                  : StewiePayBrand.colors.onSurfaceVariant
                              }}
                            >
                              {percentage.toFixed(1)}% used
                            </Text>
                          </View>
                        </View>

                        <View style={styles.budgetFooter}>
                          <Text variant="bodySmall" style={{ color: StewiePayBrand.colors.onSurfaceVariant }}>
                            {remaining >= 0
                              ? `ETB ${remaining.toLocaleString()} remaining`
                              : `ETB ${Math.abs(remaining).toLocaleString()} over`}
                          </Text>
                        </View>
                    </View>
                  </Animatable.View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Budget Dialog */}
      <Portal>
        <Dialog
          visible={createDialogVisible}
          onDismiss={() => setCreateDialogVisible(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title>Create Budget</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Category"
              value={formData.category}
              onChangeText={(text: string) => setFormData({ ...formData, category: text })}
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="Amount (ETB)"
              value={formData.amount}
              onChangeText={(text: string) => setFormData({ ...formData, amount: text })}
              mode="outlined"
              keyboardType="numeric"
              style={styles.dialogInput}
            />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
              Period: {formData.period === 'monthly' ? 'Monthly' : 'Weekly'}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCreate}>Create</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={editDialogVisible}
          onDismiss={() => setEditDialogVisible(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title>Edit Budget</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Amount (ETB)"
              value={formData.amount}
              onChangeText={(text: string) => setFormData({ ...formData, amount: text })}
              mode="outlined"
              keyboardType="numeric"
              style={styles.dialogInput}
            />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
              Period: {formData.period === 'monthly' ? 'Monthly' : 'Weekly'}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleUpdate}>Update</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Revolutionary FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: StewiePayBrand.colors.primary }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setCreateDialogVisible(true);
        }}
        label="New Budget"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#0A0A0A' // Darker than cards but not pure black
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 32
  },
  content: {
    paddingHorizontal: 20
  },
  emptyCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 2
  },
  emptyCardContent: {
    alignItems: 'center',
    paddingVertical: 40
  },
  budgetsList: {
    gap: 12,
    marginBottom: 20
  },
  budgetCard: {
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    padding: 16,
    marginBottom: 12
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  budgetAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  dialogInput: {
    marginBottom: 8
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  progressInfo: {
    marginTop: 8,
    alignItems: 'center',
  },
});

