import React from 'react';
import { View, StyleSheet, Share, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryColor, getCategoryIcon } from '../utils/category-utils';
import { StewiePayBrand } from '../brand/StewiePayBrand';
import { StewieCard } from '../components/stewiepay/StewieCard';
import { StewieText } from '../components/stewiepay/StewieText';
import { BackButton } from '../components/navigation/BackButton';

export const TransactionDetailScreen = ({ route }: any) => {
  const { transaction } = route.params || {};

  if (!transaction) {
    return (
      <View style={styles.container}>
        <BackButton />
        <StewieCard elevated style={styles.card}>
          <StewieText variant="titleLarge" color="primary" weight="bold">
            Transaction not found
          </StewieText>
          <StewieText variant="bodyMedium" color="muted" style={{ marginTop: StewiePayBrand.spacing.sm }}>
            This transaction could not be loaded.
          </StewieText>
        </StewieCard>
      </View>
    );
  }

  const statusColor =
    transaction.status === 'DECLINED'
      ? StewiePayBrand.colors.error
      : transaction.status === 'AUTHORIZED'
        ? StewiePayBrand.colors.warning
        : StewiePayBrand.colors.success;
  const isCredit = transaction.amount > 0;
  const amountColor = isCredit ? StewiePayBrand.colors.secondary : StewiePayBrand.colors.textPrimary;
  const directionLabel = isCredit ? 'Credit' : 'Debit';

  const categoryIcon = getCategoryIcon(transaction.category);
  const categoryColor = getCategoryColor(transaction.category);

  const handleShare = async () => {
    const lines = [
      `Merchant: ${transaction.merchantName || 'Unknown Merchant'}`,
      `Amount: ${isCredit ? '+' : '-'}ETB ${Math.abs(transaction.amount).toLocaleString()}`,
      `Status: ${transaction.status}`,
      `Date: ${new Date(transaction.createdAt || transaction.timestamp).toLocaleString()}`,
      `Category: ${transaction.category || 'Uncategorized'}`,
      `MCC: ${transaction.mcc || '—'}`,
      `Card ID: ${transaction.cardId || '—'}`,
      `Transaction ID: ${transaction.id || '—'}`,
    ];
    try {
      await Share.share({ message: lines.join('\n') });
    } catch {
      // ignore share errors
    }
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <StewieCard elevated style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <StewieText variant="labelSmall" color="muted">Merchant</StewieText>
            <StewieText variant="titleLarge" color="primary" weight="bold">
              {transaction.merchantName || 'Unknown Merchant'}
            </StewieText>
          </View>
          <View style={[styles.statusPill, { backgroundColor: `${statusColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <StewieText variant="labelSmall" style={{ color: statusColor, marginLeft: StewiePayBrand.spacing.xs }} weight="semibold">
              {transaction.status}
            </StewieText>
          </View>
        </View>

        <View style={styles.categoryRow}>
          <View style={[styles.categoryIcon, { backgroundColor: `${categoryColor}20` }]}>
            <StewieText variant="titleLarge">{categoryIcon}</StewieText>
          </View>
          <View>
            <StewieText variant="labelSmall" color="muted">Category</StewieText>
            <StewieText variant="titleMedium" color="primary" weight="semibold">
              {transaction.category || 'Uncategorized'}
            </StewieText>
          </View>
        </View>

        <View style={styles.merchantRow}>
          <View style={styles.merchantAvatar}>
            <Ionicons name="storefront-outline" size={20} color={StewiePayBrand.colors.primary} />
          </View>
          <StewieText variant="bodySmall" color="muted">
            Merchant logo placeholder
          </StewieText>
        </View>

        <View style={styles.amountRow}>
          <StewieText variant="labelSmall" color="muted">Amount</StewieText>
          <StewieText variant="headlineLarge" weight="black" style={{ color: amountColor }}>
            {isCredit ? '+' : '-'}ETB {Math.abs(transaction.amount).toLocaleString()}
          </StewieText>
        </View>

        <View style={styles.divider} />

        <DetailRow icon="calendar-outline" label="Date" value={new Date(transaction.createdAt || transaction.timestamp).toLocaleString()} />
        <DetailRow icon="swap-horizontal-outline" label="Direction" value={directionLabel} />
        <DetailRow icon="pricetag-outline" label="Category" value={transaction.category || 'Uncategorized'} />
        <DetailRow icon="key-outline" label="MCC" value={transaction.mcc || '—'} />
        <StewieText variant="labelSmall" color="muted" style={styles.helperText}>
          MCC is the merchant category code used by card networks.
        </StewieText>
        <DetailRow icon="card-outline" label="Card ID" value={transaction.cardId || '—'} />
        <DetailRow icon="finger-print-outline" label="Transaction ID" value={transaction.id || '—'} />

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={18} color={StewiePayBrand.colors.textPrimary} />
            <StewieText variant="labelMedium" color="primary" weight="semibold" style={styles.actionLabel}>
              Share
            </StewieText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => {}} activeOpacity={0.7}>
            <Ionicons name="flag-outline" size={18} color={StewiePayBrand.colors.textPrimary} />
            <StewieText variant="labelMedium" color="primary" weight="semibold" style={styles.actionLabel}>
              Report issue
            </StewieText>
          </TouchableOpacity>
        </View>
      </StewieCard>
    </View>
  );
};

const DetailRow = ({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLeft}>
      <Ionicons name={icon} size={18} color={StewiePayBrand.colors.textMuted} />
      <StewieText variant="bodyMedium" color="muted" style={{ marginLeft: StewiePayBrand.spacing.sm }}>
        {label}
      </StewieText>
    </View>
    <StewieText variant="bodyMedium" color="primary" weight="semibold" style={styles.detailValue}>
      {value}
    </StewieText>
  </View>
);

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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: StewiePayBrand.spacing.md,
  },
  statusPill: {
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
  amountRow: {
    marginBottom: StewiePayBrand.spacing.md,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: StewiePayBrand.spacing.sm,
    marginBottom: StewiePayBrand.spacing.md,
  },
  merchantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${StewiePayBrand.colors.primary}20`,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: StewiePayBrand.spacing.sm,
    marginBottom: StewiePayBrand.spacing.md,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: StewiePayBrand.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: StewiePayBrand.colors.surfaceVariant,
    marginVertical: StewiePayBrand.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: StewiePayBrand.spacing.sm,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
  },
  helperText: {
    marginTop: -StewiePayBrand.spacing.xs,
    marginBottom: StewiePayBrand.spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: StewiePayBrand.spacing.sm,
    marginTop: StewiePayBrand.spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: StewiePayBrand.spacing.sm,
    borderRadius: StewiePayBrand.radius.md,
    borderWidth: 1,
    borderColor: StewiePayBrand.colors.surfaceVariant,
    backgroundColor: StewiePayBrand.colors.surface,
  },
  actionLabel: {
    marginLeft: StewiePayBrand.spacing.sm,
  },
});
